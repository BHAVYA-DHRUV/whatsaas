# WhatSaaS — Enterprise Architecture Audit

**Date:** 2026-05-23  
**Stack:** Next.js 16 (App Router) · Drizzle ORM · PostgreSQL · BullMQ/Redis · Pusher · next-intl · Evolution API

---

## Executive summary

The platform has a **solid foundation** (multi-tenant schema, inbox shell, Pusher realtime, queue scaffolding, onboarding, middleware routing fixes) but is **not production-ready** due to **35+ TypeScript errors**, **9 missing UI modules**, **2 missing plugin packages**, layout/routing instability (partially fixed), and **incomplete enterprise surfaces** (CRM panel, global search, notifications, automation visual builder).

**Priority order:** (1) compile cleanly, (2) stabilize App Router, (3) complete inbox realtime, (4) billing UX, (5) automation/search/notifications, (6) DevOps hardening.

---

## 1. Repository structure

| Path | Purpose |
|------|---------|
| `app/[locale]/` | All user-facing routes (i18n segment) |
| `app/[locale]/(dashboard)/` | CRM: inbox, dashboard, campaigns, templates, settings |
| `app/[locale]/(admin)/` | Super-admin |
| `app/[locale]/(login)/` | Auth + server actions |
| `app/api/` | REST + webhooks (Evolution, Stripe, Twilio, Meta) |
| `components/` | UI (chat, inbox, layout, dashboard) |
| `lib/db/` | Drizzle schema, migrations, queries |
| `lib/services/` | Inbox service (partial) |
| `lib/plugins/` | Plugin registry — **only `ai-chat` implemented** |
| `lib/queue/` | BullMQ queues (requires `REDIS_URL`) |
| `workers/` | Campaign/automation workers |
| `docs/enterprise/` | Architecture plans + routing flow |

---

## 2. Build / TypeScript errors (complete list)

### 2.1 Missing modules (must create)

| Import | Used by |
|--------|---------|
| `@/components/templates/WhatsAppPreview` | templates, campaigns/new |
| `@/components/dashboard/analytics-charts` | analytics/page |
| `@/components/automation/CreateAutomationButton` | automation/page |
| `@/components/automation/AutomationStatusToggle` | automation/page |
| `@/components/automation/FlowBuilder` | automation/[id] |
| `@/components/admin/PlanForm` | admin/plans |
| `@/components/ai/ToolsManager` | settings/ai |
| `@/components/sessions/SessionsSheet` | settings/ai, automation |
| `@/lib/plugins/voice-call/service` | calls API, webhooks |
| `@/lib/plugins/voice-call/twilio-client` | calls/numbers |
| `@/lib/plugins/meta-cloud/provider` | whatsapp/provider-factory |
| `@/lib/plugins/meta-cloud/webhook-handler` | webhook/meta-cloud |

### 2.2 Schema / type mismatches

| Issue | Files |
|-------|-------|
| `plans.gatewayId` missing in schema but used in admin-actions, payments | `schema.ts`, `admin-actions.ts`, `payments/actions.ts` |
| `InstanceData.integration` required but API returns partial | `ChatListItem`, `InboxShell`, `VirtualizedChatList` |
| `CustomAudioPlayer` requires `isMe` | `MessageBubble.tsx` |
| Branding fallback missing `id`, `createdAt` | `layout.tsx`, `queries/branding.ts` |
| `isQueueEnabled` not exported from `queues.ts` | `enqueue.ts` |
| `features` typed as `{}` in call wrapper | `call-provider-wrapper.tsx` |
| `gatewayId` on plan type (admin delete) | `admin-actions.ts` |

### 2.3 Non-blocking

| Issue | Files |
|-------|-------|
| `@types/pg` missing | `scripts/fix-db.ts` |
| Meta webhook `e` implicit any | `webhook/meta-cloud/route.ts` |

---

## 3. Routing & rendering

### Fixed (recent)

- `localePrefix: 'never'` + middleware rewrite for `/dashboard`, `/inbox`, etc.
- `X-NEXT-INTL-LOCALE` on rewrites
- Removed `app/page.tsx` redirect loop (`/` → `/en` ↔ `/`)
- Server-side onboarding gates in `(dashboard)/layout.tsx`

### Remaining risks

| Risk | Mitigation |
|------|------------|
| Full page reload on nav | Add `(dashboard)/loading.tsx`, keep shell in layout, use `Link` from `@/i18n/routing` |
| Duplicate layouts | `dashboard/layout.tsx` + `inbox/layout.tsx` — verify no double sidebar |
| Client `usePathname` vs rewrite | `x-pathname` header for server; client pathname may include `/en` — sidebar normalizes |
| Onboarding ↔ dashboard loop | Only redirect on `onboardingCompletedAt` timestamp (fixed in wizard) |

See `docs/enterprise/ROUTING-FLOW.md`.

---

## 4. Realtime architecture

### Implemented

```
Evolution webhook → app/api/webhook/evolution → DB (messages, chats)
                  → pusherServer.trigger(teamChannel, 'new-message' | 'chat-list-update')
                  → InboxShell SWR mutate
```

- **Client:** `lib/pusher-client.ts`, `getTeamChannel(teamId)`
- **Server:** `lib/pusher-server.ts`
- **Inbox:** `components/inbox/InboxShell.tsx` binds events

### Gaps

| Gap | Phase |
|-----|-------|
| Typing indicators | Pusher event + ChatInput emit |
| Read receipts sync | API + bubble status |
| Optimistic send | Chat window client state |
| Message infinite scroll | Virtualizer in chat thread |
| Queue path for inbound | Webhook → BullMQ → worker → Pusher |
| Meta Cloud inbound | Plugin `webhook-handler` (stub → full) |

---

## 5. Inbox / 4-column layout

### Current

```
| Sidebar (enterprise) | Chat list (InboxShell) | children (chat route) |
```

### Target

```
| Sidebar | Chat List | Chat Window | CRM Panel |
```

| Component | Status |
|-----------|--------|
| `InboxShell` | ✅ List + filters + virtualized list |
| `VirtualizedChatList` | ✅ @tanstack/react-virtual |
| `components/chat/*` | ✅ Bubble, input, header, sidebar |
| `ChatSidebar` | ✅ Partial CRM (contact) |
| Dedicated CRM panel column | ❌ Not split as 4th column |
| Pinned / SLA / AI status badges | ❌ Partial in schema only |

---

## 6. Plugin system

`lib/plugins/registry.ts`:

```ts
installed = ['ai-chat']  // voice-call, meta-cloud commented out
```

| Plugin | Status |
|--------|--------|
| ai-chat | ✅ Providers, tools, service |
| voice-call | ❌ Files missing — **being added** |
| meta-cloud | ❌ Files missing — **being added** |

---

## 7. Data layer & multi-tenancy

### Strengths

- `teamId` on chats, contacts, messages, automations, campaigns
- `getTeamForUser()` in server actions
- `withTeam` middleware for payments

### Gaps

| Gap | Recommendation |
|-----|----------------|
| Central tenant guard helper | `lib/auth/tenant.ts` — `assertTeamResource()` |
| API routes without team check | Audit all `app/api/**` |
| Queue job payload | Always include `teamId`; workers validate |
| Webhook instance lookup | Scope by `evolutionInstances.teamId` |

---

## 8. Phase roadmap (aligned to your request)

| Phase | Status | Notes |
|-------|--------|-------|
| 1 Audit | ✅ This document | |
| 2 Build errors | 🔄 In progress | Missing components + plugins |
| 3 App Router | 🔄 Partial | loading.tsx, layout split |
| 4 Realtime inbox | 🔄 60% | Pusher + virtual list |
| 5 Templates | 🔄 WhatsAppPreview | |
| 6 Analytics | 🔄 analytics-charts | |
| 7 Automation | 🔄 FlowBuilder + button | |
| 8 Global search | ❌ | Needs `/api/search` + command palette |
| 9 Notifications | ❌ | Toast only (sonner) |
| 10 Performance | 🔄 | Virtualization started |
| 11 Billing UI | ❌ | Enhance PricingClient |
| 12 Tenant isolation | 🔄 | Audit API routes |
| 13 DevOps | 🔄 | ecosystem.config.js exists |
| 14 Final UX | ❌ | After stability |

---

## 9. Duplicate / dead code

| Item | Action |
|------|--------|
| `components/interface/Sidebar.tsx` | Re-exports enterprise sidebar — OK |
| `app/[locale]/(dashboard)/dashboard/layout.tsx` | Review vs parent shell |
| Prisma folder + Drizzle | Prisma config present but app uses Drizzle — document single ORM |
| `redirect('/login')` in automation | Should be `/sign-in` |

---

## 10. Immediate actions (this sprint)

1. ✅ Create missing components (Phase 2)
2. ✅ Add `voice-call` + `meta-cloud` plugin modules
3. ✅ Add `plans.gateway_id` column + fix types
4. Add `(dashboard)/loading.tsx` + `error.tsx`
5. Run `npx tsc --noEmit` until clean
6. Seed plans: FREE / STARTER / BUSINESS / ENTERPRISE
7. Extend inbox to 4-column with `CrmPanel` component

---

## 11. Environment dependencies

| Variable | Required for |
|----------|----------------|
| `POSTGRES_URL` | Database |
| `AUTH_SECRET` | Sessions |
| `PUSHER_*` | Realtime inbox |
| `REDIS_URL` | Queues (optional dev) |
| `EVOLUTION_API_URL` | WhatsApp send/receive |
| `STRIPE_*` | Billing |

---

*Next update after Phase 2 compile is green.*
