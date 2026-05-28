# WhatSaaS — Production deployment & performance

## Quick deploy (Windows / Linux)

```bash
# 1. Bootstrap database
pnpm db:bootstrap
pnpm db:migrate          # applies 0004 performance indexes if not yet run
pnpm db:recovery

# 2. Production build
pnpm build

# 3. PM2 cluster (recommended on VPS)
pnpm pm2:start
pm2 save
pm2 monit

# 4. Docker full stack (Postgres + Redis + App + Nginx)
docker compose -f docker-compose.prod.yml up -d --build
```

Health: `GET /api/health` → `{ status: "healthy", checks: { database, redis, app } }`

---

## Changed files (optimization pass)

| Area | Files |
|------|--------|
| Env / boot | `lib/env.ts`, `instrumentation.ts` |
| Redis cache | `lib/cache/redis-cache.ts`, `lib/redis.ts` |
| Rate limit | `lib/rate-limit.ts`, `lib/api/with-rate-limit.ts` |
| DB pool + indexes | `lib/db/drizzle.ts`, `lib/db/schema.ts`, `lib/db/migrations/0004_performance_indexes.sql` |
| Query cache | `lib/db/queries.ts`, `lib/db/queries/branding.ts` |
| API | `app/api/chats/route.ts`, `app/api/dashboard/metrics/route.ts`, `app/api/health/route.ts` |
| Realtime | `lib/realtime/use-team-channel.ts`, `lib/pusher-server.ts`, `components/inbox/InboxShell.tsx` |
| Next.js | `next.config.ts` (standalone, package import optimization, images) |
| Frontend | `app/.../dashboard/page.tsx`, `dashboard/loading.tsx`, `pricing-client` (memo) |
| Infra | `Dockerfile`, `docker-compose.prod.yml`, `deploy/nginx/whatsaas.conf`, `ecosystem.config.js` |

---

## Optimizations applied

### Next.js
- `output: 'standalone'` for Docker/PM2
- `optimizePackageImports` for lucide, recharts, radix
- Image AVIF/WebP
- Dashboard metrics via single cached API (not full chat list)
- SWR `dedupingInterval` + no focus revalidation on inbox
- `React.memo` on dashboard + pricing
- Route `loading.tsx` skeletons
- `unstable_cache` for plans (300s) and branding (600s)

### Database
- Connection pool: `PG_POOL_MAX` (default 12 prod / 4 dev)
- Indexes: `messages(chat_id, timestamp)`, `chats(team_id, last_message_timestamp)`, `team_members(team_id|user_id)`
- Paginated messages API (50/page) via `useChatMessages`

### Redis
- Chat list cache (12s TTL), dashboard metrics (30s)
- Invalidation on Pusher `new-message` / `chat-list-update`
- Rate limiting (120 req/min per IP per route)

### Realtime
- `useTeamChannel` / `useInboxRealtime` with debounced handlers (150ms)
- Guaranteed `unbind` on unmount

### Docker / Nginx / PM2
- Multi-stage Dockerfile, healthchecks
- Postgres + Redis persistent volumes, memory limits
- Nginx gzip, static caching, websocket upgrade proxy
- PM2 cluster `instances: max`, memory restart 1G

---

## Environment variables (production)

```env
NODE_ENV=production
POSTGRES_URL=postgres://...
REDIS_URL=redis://...
AUTH_SECRET=<32+ chars>
BASE_URL=https://your-domain.com
PG_POOL_MAX=12
PM2_INSTANCES=max
```

---

## Performance expectations (typical VPS)

| Metric | Before (baseline) | After (target) |
|--------|-------------------|----------------|
| Homepage TTFB | DB error / cold | < 400ms (cached plans) |
| Dashboard load | 2 SWR + full chats | 1 metrics API ~50–150ms |
| Inbox chat list | DB every request | Redis hit ~12s TTL |
| DB inbox query | Seq scan risk | Index scan on team + timestamp |
| WS listener leaks | Possible duplicates | Cleanup on unmount |

*Run Lighthouse in Chrome DevTools → Performance + run `pnpm build && pnpm start` for accurate scores on your hardware.*

### Lighthouse checklist
- Enable production build
- Serve over HTTPS (Nginx SSL termination)
- Verify no hydration errors in console
- Target: Performance ≥ 75, Accessibility ≥ 90 (varies by content)

---

## Docker resource summary

| Service | Memory limit | Persistence |
|---------|--------------|-------------|
| postgres | 1G | `pgdata` volume |
| redis | 384M | AOF `redisdata` |
| app | 1.5G | stateless |
| nginx | 128M | config mount |

---

## Database optimization summary

```sql
-- Applied via 0004 + recovery script
messages_chat_id_timestamp_idx
chats_team_id_last_message_timestamp_idx
team_members_team_id_idx / user_id_idx
```

Verify: `pnpm db:audit`

---

## Monitoring

- **Health:** `/api/health`
- **PM2:** `pm2 monit`, logs in `logs/pm2/`
- **Redis:** `redis-cli INFO memory`
- **Postgres:** `pg_stat_user_indexes` for index usage

Optional stack (add separately): Prometheus + Grafana, Uptime Kuma pointing at `/api/health`.

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| Slow inbox | Set `REDIS_URL`, confirm `X-Cache: HIT` on `/api/chats` |
| High memory PM2 | Lower `PM2_INSTANCES` or `max_memory_restart` |
| Docker app unhealthy | Check `docker logs`, run migrations inside container |
| Stale chat list | Cache TTL 12s; force refresh or wait for invalidation event |
