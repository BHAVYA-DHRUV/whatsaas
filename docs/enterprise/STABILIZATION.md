# Production stabilization (incremental)

This document tracks stabilization work on the **existing** `whats-saas-main` app (Drizzle, Next.js App Router, Pusher, BullMQ). No greenfield rewrite.

## Phase 1 — Database

**Issue:** `plans.gateway_id` was dropped in migration `0001` while the app still references it.

**Fix:**
- `lib/db/migrations/0003_superb_wong.sql` — idempotent re-add column + FK
- `scripts/db/migrate-recovery.sql` — production-safe recovery
- `pnpm db:migrate` / `pnpm db:recovery` / `pnpm db:audit`

If audit reports **all tables missing**, your `POSTGRES_URL` points at an empty database — run migrations and seed on the correct DB.

## Phase 2 — Realtime chat

- Canonical events: `lib/realtime/events.ts`
- Typing: `POST /api/realtime/typing` + `useTypingIndicator` (wired in chat page)
- Paginated messages: `GET /api/messages?limit=&before=` + `useChatMessages` hook
- Queue job IDs: `tenantJobId()` in `lib/auth/tenant.ts` + `lib/queue/enqueue.ts`

## Phase 3 — Frontend

- `PricingClient` wrapped in `React.memo` + `useMemo` for plan filtering
- Dashboard `loading.tsx` for route transitions

## Phase 4–5 — Inbox / CRM

- `CrmPanel` replaces `ChatSidebar` on chat page (lead score, pipeline, notes, AI/automation badges)
- Inbox shell: `components/inbox/InboxShell.tsx`

## Next priorities

1. Apply `assert*BelongsToTeam` on remaining sensitive API routes
2. Enterprise plan seed (FREE / STARTER / BUSINESS / ENTERPRISE)
3. Automation visual builder hardening + DLQ analytics
4. DevOps: PM2 cluster, Docker prod, Prometheus/Grafana stack
5. Security pass: rate limits, webhook signatures, audit logs

## Verify locally

```bash
pnpm db:bootstrap
pnpm dev
```

Schema audit should show **Critical issues: None** (`docs/enterprise/SCHEMA-AUDIT.md`).

Login: `test@test.com` / `admin123`
