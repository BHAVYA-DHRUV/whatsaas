# WhatSaaS Production Deployment Guide

## Architecture overview

| Layer | Component |
|-------|-----------|
| Edge | Cloudflare DNS + SSL (or Let's Encrypt on NGINX) |
| Proxy | NGINX — HTTPS, WebSocket, rate limits |
| App | Next.js 16 via PM2 cluster |
| Workers | PM2 — campaign processor, scheduler, health ping |
| Data | PostgreSQL 16, Redis 7 |
| WhatsApp | Evolution API (QR) and/or Meta Cloud API |
| Realtime | Pusher |
| Email | Resend |

**Tenant model:** Each customer is a `teams` row. All CRM, chats, automations, AI, and campaigns are scoped by `teamId`.

---

## Day 1 — Server setup (Linux VPS recommended)

Your app runs on **Windows** for development; **production should use Ubuntu 22.04+** (NGINX, UFW, Fail2ban, PM2 are Linux-native). Use WSL2 only for local testing of scripts.

### 1. Install dependencies

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql-client redis-tools fail2ban ufw
sudo npm install -g pm2 pnpm
```

### 2. Database & Redis

```bash
cd whats-saas-main
cp .env.example .env
# Edit POSTGRES_PASSWORD, then:
export POSTGRES_PASSWORD=your_strong_password
docker compose -f docker-compose.prod.yml up -d
```

Set in `.env`:

```
POSTGRES_URL=postgresql://whats_saas:your_strong_password@localhost:5432/whats_saas
REDIS_URL=redis://localhost:6379
```

### 3. Application build

```bash
pnpm install
pnpm add ioredis   # optional but recommended for Redis health + future queues
pnpm db:migrate
pnpm db:seed:production
pnpm build
mkdir -p logs/pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. NGINX + SSL

```bash
sudo cp infra/nginx/proxy-params.conf /etc/nginx/snippets/whats-saas-proxy.conf
# Edit infra/nginx/whats-saas.conf — set YOUR_DOMAIN
sudo cp infra/nginx/whats-saas.conf /etc/nginx/sites-available/whats-saas
sudo ln -s /etc/nginx/sites-available/whats-saas /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo nginx -t && sudo systemctl reload nginx
```

**Cloudflare:** Set SSL mode to *Full (strict)*, proxy orange-cloud ON, WebSockets enabled.

### 5. Firewall & Fail2ban

```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Fail2ban: enable `sshd` and create a jail for NGINX 401/429 on `/api/` (see `SECURITY.md`).

### 6. Evolution API

Deploy Evolution separately (Docker or host). Point:

- `EVOLUTION_API_URL` → Evolution base URL
- Webhook URL in Evolution → `https://your-domain.com/api/webhook/evolution`
- Instance names per tenant: `tenant-1-wa`, `tenant-2-wa`, `tenant-3-wa`

---

## Health & monitoring

| Check | URL / command |
|-------|----------------|
| App health | `GET /api/health` |
| PM2 | `pm2 monit`, `pm2 logs` |
| Uptime Kuma | Monitor `/api/health` |
| Grafana/Prometheus | `infra/monitoring/docker-compose.monitoring.yml` |

---

## Cron / workers

Campaigns are **not** self-scheduled inside Next.js. PM2 workers call:

`GET /api/campaigns/process` with `Authorization: Bearer $CRON_SECRET`

Workers are defined in `ecosystem.config.js`.

---

## Backups

```bash
chmod +x infra/scripts/*.sh
# Crontab (daily 2am):
0 2 * * * POSTGRES_URL=... infra/scripts/backup-postgres.sh
30 2 * * * APP_DIR=/path/to/whats-saas-main infra/scripts/backup-media.sh
```

---

## Windows development note

- Use `pnpm dev` locally
- PM2 on Windows: `pm2 start ecosystem.config.js` works but **cluster mode** is limited; use `PM2_INSTANCES=1` on Windows
- UFW/Fail2ban do not apply; use Windows Firewall

---

## Related docs

- [ENVIRONMENT.md](./ENVIRONMENT.md) — all variables
- [TENANT_ONBOARDING.md](./TENANT_ONBOARDING.md) — new customer setup
- [WHATSAPP.md](./WHATSAPP.md) — Evolution + Meta
- [SECURITY.md](./SECURITY.md) — hardening checklist
- [RECOVERY.md](./RECOVERY.md) — backup restore
