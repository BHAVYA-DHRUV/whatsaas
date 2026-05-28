# Phase 1 — Infrastructure Audit Report

Generated for WhatSaaS enterprise production pass.

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Next.js app | ✅ Implemented | v16, Drizzle ORM |
| PM2 ecosystem | ✅ Implemented | `ecosystem.config.js` — 7 processes |
| Docker stack | ✅ Implemented | `docker-compose.yml` |
| NGINX | ✅ Templates | `infra/nginx/nginx-production.conf` |
| Redis + BullMQ | ✅ Implemented | Requires `npm install` |
| Evolution API | ⚠️ Config required | Docker service + `.env` |
| PostgreSQL | ⚠️ Must be running | Local or Docker |
| Prisma | ⚠️ Legacy stub | Use Drizzle migrations |
| Monitoring | ✅ Compose template | Uptime Kuma, Grafana |
| Backups | ✅ Scripts | Daily pg_dump + media tar |
| Meta Cloud plugin | ⚠️ Partial | Enable in registry if bundled |
| Multi-tenant | ✅ teamId scoping | `tenant-guard.ts` added |

## Security risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Webhook without apikey | High | `evolution-auth.ts` enforced in prod |
| Weak AUTH_SECRET | High | Rotate 64-byte hex |
| In-memory rate limit | Medium | Redis + NGINX limits |
| Local file uploads | Medium | Move to S3 for scale |
| Single team per user | Low | No team switcher yet |

## Performance risks

| Risk | Impact |
|------|--------|
| Turbopack on Windows | Dev crashes — use webpack |
| No PgBouncer | Connection exhaustion at scale |
| Campaigns in HTTP cron | Mitigated by BullMQ workers |

## Failure risks

| Scenario | Recovery |
|----------|----------|
| Postgres down | Restore from `backup-postgres.sh` |
| Redis down | Workers stop; app falls back to HTTP cron |
| Evolution disconnect | Re-scan QR |
| PM2 crash | `autorestart` + `pm2 startup` |

## Validation commands

```bash
npm run audit:health
docker compose ps
pm2 status
curl http://localhost:3000/api/health
curl http://localhost:8080
```

## Next actions (priority)

1. `docker compose up -d` + `npx drizzle-kit migrate`
2. `npm install` (adds bullmq, ioredis)
3. Configure Evolution + scan QR
4. Deploy to Ubuntu VPS with PM2 + NGINX
5. Run `npm run db:seed:production`
