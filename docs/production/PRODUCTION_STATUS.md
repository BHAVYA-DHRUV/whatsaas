# Production readiness status

Last updated: implementation pass (Day 1 foundation).

## Completed in repo

| Phase | Status | Artifacts |
|-------|--------|-----------|
| PM2 ecosystem | Done | `ecosystem.config.js`, workers |
| NGINX template | Done | `infra/nginx/` |
| Docker prod stack | Done | `docker-compose.prod.yml` |
| Redis integration (optional) | Done | `lib/redis.ts`, health check |
| Health API | Done | `/api/health` |
| Backup scripts | Done | `infra/scripts/backup-*.sh` |
| Production seed | Done | `pnpm db:seed:production` |
| RBAC extension | Done | `manager`, `support` roles |
| Default automations + CRM | Done | seed templates |
| Documentation | Done | `docs/production/*` |
| Monitoring compose | Done | `infra/monitoring/` |

## Requires your environment (manual)

| Phase | Action |
|-------|--------|
| Evolution API URL | Set `EVOLUTION_API_URL` in `.env` |
| SSL / domain | Deploy NGINX + certbot or Cloudflare |
| Linux VPS | UFW, Fail2ban, PM2 startup |
| Meta Cloud plugin | Enable if using official API channel |
| Stripe/Razorpay/Pusher/Resend | Add keys via Admin or `.env` |
| OpenAI | Per-tenant keys in dashboard |
| QR connect | Per tenant instance in UI |
| Grafana metrics | Add prom-client exporter (optional enhancement) |
| Distributed queue (Bull) | Future: replace HTTP cron with Redis queues |

## Validation commands

```bash
pnpm db:migrate
pnpm db:seed:production
pnpm build
curl http://localhost:3000/api/health
pm2 start ecosystem.config.js --env production
```

## Phase 17 checklist

- [ ] SSL working
- [ ] `/api/health` returns `ok`
- [ ] PM2 workers running
- [ ] Evolution webhook receiving events
- [ ] Campaign processor authorized with `CRON_SECRET`
- [ ] Backups cron installed
- [ ] Tenant isolation spot-check (3 demo tenants)
- [ ] Passwords rotated from demo defaults
