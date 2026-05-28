# WhatSaaS — Architecture Improvement Plan

## Current state (audit)

| Area | Status |
|------|--------|
| Multi-tenancy | `teams` + `teamId` on resources (Drizzle) |
| Auth | JWT session cookies, RBAC presets |
| WhatsApp | Evolution + Meta, webhooks, instances |
| Inbox UI | `/inbox` + chat APIs + Pusher |
| Pipeline | Kanban at `/pipeline` (funnel stages) |
| Campaigns / Automation | Routes + BullMQ workers |
| Admin | Full platform admin panel |

## Root cause: `/dashboard` 404

Next.js `[locale]` captured `dashboard` as locale → `notFound()`.

**Fix:** Middleware rewrites `/dashboard` → `/en/dashboard` when the first segment is a known app route.

## Target route map

| URL | Purpose |
|-----|---------|
| `/dashboard` | Analytics overview |
| `/inbox` | WhatsApp inbox (chat list + thread) |
| `/inbox/chat/[jid]` | Active conversation |
| `/pipeline` | CRM Kanban |
| `/contacts` | Contact CRM |
| `/campaigns` | Broadcasts |
| `/automation` | Flow builder |
| `/settings/*` | Tenant settings |

## Phased delivery

### Phase 1 — Foundation (this sprint)
- [x] Locale routing fix
- [x] Enterprise sidebar + topbar
- [x] Dashboard overview page
- [x] Inbox route + `InboxShell`
- [x] Pipeline page (Kanban)
- [x] Chat UI components restored

### Phase 2 — Onboarding
- [x] Workspace creation wizard (`/onboarding`)
- [x] Plan selection (free via API; paid → `/pricing`)
- [x] WhatsApp connect (QR via Evolution `/api/instance/setup`)
- [x] Team invites (reuse `inviteTeamMember`)
- [x] `teams.onboarding_completed_at` + redirect for new workspaces

### Phase 3 — Enterprise services layer
```
lib/
  services/     # business logic (inbox: getTeamChatsForInbox)
  repositories/ # data access (chat-repository)
  validators/   # zod schemas (inbox query)
workers/bullmq/ # queues (existing)
```
- [x] Inbox chat list → repository + service + validator
- [x] Virtualized inbox list (`@tanstack/react-virtual`)
- [ ] Extend pattern to messages, contacts, campaigns

### Phase 4 — Realtime & scale
- Pusher required in production
- Redis + BullMQ for all async work
- Rate limiting on all public APIs

### Phase 5 — DevOps
- PM2 ecosystem (existing)
- NGINX + SSL
- Backup scripts (existing in `infra/`)

## Stack alignment

| Requested | Current | Action |
|-----------|---------|--------|
| React Query | SWR | Keep SWR; add React Query later if needed |
| Zustand | — | Add for inbox UI state in Phase 2 |
| Framer Motion | — | Add for page transitions Phase 2 |
| Prisma | Stub only | Remove stub; Drizzle is source of truth |

## Security checklist

- [x] Webhook signature validation (Evolution)
- [x] Tenant-scoped queries (`teamId`)
- [ ] Rate limit all `/api/v1/*`
- [ ] CSRF on mutations
- [ ] Audit log on admin actions
