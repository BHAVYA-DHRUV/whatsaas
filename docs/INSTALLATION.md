# WhatSaaS — Installation (Windows 11)

Official flow for the **existing** Next.js + Drizzle stack in `whats-saas-main`.

## Prerequisites

- Node.js 20+ and npm/pnpm
- PostgreSQL 15+ (local or Docker)
- Redis (optional; required for BullMQ queues)
- Docker Desktop (optional; for Postgres/Redis/Evolution)
- Evolution API instance (WhatsApp)
- Pusher account (realtime inbox)
- Stripe / Razorpay (billing; configure in Admin after install)

## 1. Install dependencies

```bash
cd whats-saas-main
pnpm install
```

## 2. Environment

Interactive setup (writes `.env`):

```bash
pnpm db:setup
```

Or copy `.env.example` and set at minimum:

| Variable | Purpose |
|----------|---------|
| `POSTGRES_URL` | PostgreSQL connection (app + Drizzle) |
| `AUTH_SECRET` | Session signing (32+ random bytes) |
| `BASE_URL` | `http://localhost:3000` locally |
| `PUSHER_*` | Realtime channels |
| `EVOLUTION_API_URL` | WhatsApp bridge |
| `AUTHENTICATION_API_KEY` | Evolution API key |

`DATABASE_URL` can mirror `POSTGRES_URL` for Drizzle Kit.

## 3. Database bootstrap (required)

Creates all tables, fixes `plans.gateway_id`, seeds admin user and SaaS plans:

```bash
pnpm db:bootstrap
```

This runs:

1. `drizzle-kit migrate` — all SQL migrations
2. Recovery SQL — idempotent column/index fixes
3. `db:seed` — user `test@test.com` / `admin123`
4. `db:seed:plans` — FREE, STARTER, BUSINESS, ENTERPRISE (+ yearly)
5. Schema audit → `docs/enterprise/SCHEMA-AUDIT.md`

If you see `relation "plans" does not exist`, migrations were not applied — re-run `pnpm db:bootstrap`.

## 4. Start the app

```bash
pnpm dev
```

Open http://localhost:3000

- Login: `test@test.com` / `admin123`
- Admin: configure Payment Gateways, branding, Evolution webhooks

## 5. WhatsApp (Evolution API)

1. Run Evolution API (Docker or standalone).
2. In app: connect instance → scan QR.
3. Set webhook URL to `{BASE_URL}/api/webhook/evolution` with your webhook token.

## 6. Optional workers

```bash
pnpm workers:all
```

Requires Redis (`REDIS_URL`).

## 7. Production

See `docs/enterprise/STABILIZATION.md` and `ecosystem.config.js` for PM2.

```bash
pnpm build
pnpm pm2:start
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `relation "plans" does not exist` | `pnpm db:bootstrap` |
| `plans.gateway_id` missing | `pnpm db:recovery` |
| Branding query errors | `pnpm db:seed:plans` (creates branding row) |
| npm config warnings | Safe to ignore; from project `.npmrc` |
| Webpack EPERM on `.next/cache` | Close dev server, delete `.next`, restart |

## Verify

```bash
pnpm db:audit
```

Audit should report **Critical issues: None**.
