# WhatSaaS Enterprise Production Guide

> **Stack note:** Production data layer is **Drizzle ORM** + PostgreSQL (`lib/db/schema.ts`). The `prisma/` folder is a legacy stub — use `POSTGRES_URL` and `pnpm db:migrate`, not Prisma migrations.

## Architecture

```
Cloudflare (DNS/SSL/WAF)
        │
   NGINX (443)
   ├── app.domain.com  → PM2 nextjs-app :3000
   ├── api.domain.com  → PM2 nextjs-app :3000
   └── evolution.domain.com → Evolution :8080
        │
   ├── PostgreSQL :5432  (tenants, CRM, billing)
   ├── Redis :6379       (BullMQ, cache, rate limits)
   └── PM2 workers
         ├── campaign-worker
         ├── ai-worker
         ├── automation-worker
         ├── scheduler-worker
         ├── retry-worker (DLQ)
         └── websocket-worker (health ping)
```

## Folder structure (new)

```
whats-saas-main/
├── ecosystem.config.js          # PM2 — all processes
├── docker-compose.yml           # Postgres + Redis + Evolution
├── production.env.example
├── lib/
│   ├── queue/                   # BullMQ
│   ├── auth/tenant-guard.ts
│   └── webhook/evolution-auth.ts
├── workers/bullmq/              # Queue workers
├── infra/
│   ├── nginx/nginx-production.conf
│   ├── redis/redis.conf
│   ├── postgres/init.sql
│   ├── scripts/backup-*.sh
│   └── monitoring/
└── docs/enterprise/             # This guide
```

---

## Phase 1 — Audit

```bash
npm install
npm run audit:health
docker compose ps
pm2 status
curl -s http://localhost:3000/api/health | jq
```

| Report | File |
|--------|------|
| Infrastructure | `AUDIT-REPORT.md` |
| Security | `SECURITY-CHECKLIST.md` |
| Production status | `../production/PRODUCTION_STATUS.md` |

---

## Phase 2 — Production hardening

### PM2

```bash
pnpm build
mkdir -p logs/pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
pm2 monit
pm2 install pm2-logrotate
```

### NGINX

```bash
sudo cp infra/nginx/proxy-params.conf /etc/nginx/snippets/whats-saas-proxy.conf
sudo cp infra/nginx/nginx-production.conf /etc/nginx/sites-available/whats-saas
# Replace YOUR_DOMAIN → edit domains
sudo certbot --nginx -d app.your-domain.com -d api.your-domain.com -d evolution.your-domain.com
```

### UFW + Fail2ban (Ubuntu)

```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo apt install fail2ban -y
```

### SSL

- **Let's Encrypt** via certbot, or
- **Cloudflare** Full (strict) + origin cert

---

## Phase 3 — Database & Redis

```bash
docker compose up -d postgres redis
npx drizzle-kit migrate
npm run db:seed:production
```

**Pooling:** Use PgBouncer in high-traffic prod or limit `PM2_INSTANCES`.

**Redis:** `infra/redis/redis.conf` — AOF persistence, LRU eviction.

---

## Phase 4 — Multi-tenant validation

- Every API must use `getTeamForUser()` or `requireAuthenticatedTeam()` (`lib/auth/tenant-guard.ts`).
- Webhooks resolve `teamId` from `evolutionInstances.instanceName` (unique per tenant).
- BullMQ jobs include `teamId` in payload.
- Use `assertTenantScope(resourceTeamId, sessionTeamId)` before cross-resource updates.

**Checklist:**

- [ ] Two tenants cannot read each other's chats
- [ ] Webhook with wrong instance name is ignored
- [ ] Campaign leads scoped by team

---

## Phase 5 — WhatsApp

### Evolution (QR)

```bash
docker compose up -d evolution-api
```

`.env`:

```
EVOLUTION_API_URL=http://localhost:8080
AUTHENTICATION_API_KEY=your_key
WEBHOOK_GLOBAL_URL=http://host.docker.internal:3000/api/webhook/evolution
```

Dashboard → Settings → Connect → instance `tenant-1-wa` → scan QR.

### Meta Cloud

Admin → Channels → configure Meta app + webhook verify token.

---

## Phase 6 — Queue system (BullMQ)

Requires `REDIS_URL` + `npm install bullmq ioredis`.

| Queue | Worker | Purpose |
|-------|--------|---------|
| whats-saas-campaigns | campaign-worker | Campaign batch send |
| whats-saas-ai | ai-worker | Tenant AI replies |
| whats-saas-automation | automation-worker | Delayed flows |
| whats-saas-scheduler | scheduler-worker | Cron heartbeat |
| whats-saas-dlq | retry-worker | Failed job alerts |

Start with PM2 (included in `ecosystem.config.js`).

---

## Phase 7–11 — CRM, Automation, AI, Campaigns, Billing

| Phase | Status in app |
|-------|----------------|
| CRM pipelines | Seeded via `db:seed:production` |
| Automation | Flow builder + seed templates |
| AI | Settings → AI + `ai-worker` |
| Campaigns | Meta templates + `campaign-worker` |
| Billing | Stripe/Razorpay in Admin |

---

## Phase 12 — Monitoring

```bash
docker compose -f infra/monitoring/docker-compose.monitoring.yml up -d
```

- Uptime Kuma → monitor `https://app.domain.com/api/health`
- Grafana/Prometheus → `infra/monitoring/`
- PM2 → `pm2 monit`
- Alerts → `HEALTH_ALERT_WEBHOOK_URL`

---

## Phase 13 — Backups

```bash
chmod +x infra/scripts/*.sh
# crontab:
0 2 * * * POSTGRES_URL=... infra/scripts/backup-postgres.sh
30 2 * * * APP_DIR=/var/www/whats-saas infra/scripts/backup-media.sh
```

Retention policy: 7 daily, 4 weekly, 3 monthly (configure in scripts / S3 lifecycle).

---

## Phase 14 — Security

- JWT session: `AUTH_SECRET`
- Webhook: `lib/webhook/evolution-auth.ts`
- Rate limits: `lib/rate-limit.ts` + NGINX
- CSRF: Next.js server actions + same-site cookies
- Hide errors: `NODE_ENV=production`

---

## Phase 15 — QA

| Test | Command / action |
|------|------------------|
| Health | `npm run audit:health` |
| Login | `admin1@tenant.com` / `Tenant1Admin!2026` |
| WhatsApp | Send message to connected instance |
| AI | Enable in Settings → AI |
| Campaign | Create + start campaign |
| Tenant isolation | Login tenant-1 vs tenant-2 |

---

## Phase 16 — Demo tenants

```bash
npm run db:seed:production
```

| Tenant | Email | Password | Plan |
|--------|-------|----------|------|
| tenant-1 | admin1@tenant.com | Tenant1Admin!2026 | Starter |
| tenant-2 | admin2@tenant.com | Tenant2Admin!2026 | Business |
| tenant-3 | admin3@tenant.com | Tenant3Admin!2026 | Enterprise |

---

## Windows development

```bash
npm run dev          # webpack (stable)
docker compose up -d postgres redis
```

Use **Ubuntu VPS** for full PM2 + NGINX + UFW production stack.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 on `/api/features/all` | Sign out/in; team auto-created on login |
| Turbopack crash | `npm run dev` uses webpack |
| Evolution webhook 401 | Set `AUTHENTICATION_API_KEY` = Evolution apikey header |
| AI not replying in dev | No `REDIS_URL` in dev — uses in-memory debounce |
| AI not replying in prod | Start `ai-worker` via PM2 |
