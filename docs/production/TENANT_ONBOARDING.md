# Tenant onboarding guide

## 1. Create subscription plan (Admin)

Admin → Plans: assign **Starter**, **Business**, or **Enterprise** limits.

## 2. Create team / workspace

- Sign up user or invite via **Team → Members**
- Each workspace = one `teams` row (tenant boundary)

## 3. Assign plan

Admin → Teams → Assign plan, or Stripe/Razorpay checkout from tenant billing page.

## 4. WhatsApp connection

| Channel | Steps |
|---------|--------|
| Evolution (QR) | Dashboard → Instances → Create `tenant-slug-wa` → Scan QR |
| Meta Cloud | Admin → Channels → Enable Meta → Embedded signup per tenant |

Webhook must reach: `https://YOUR_DOMAIN/api/webhook/evolution` or `/api/webhook/meta-cloud`

## 5. Enable automation & AI

- **Automation:** Flows seeded by `pnpm db:seed:production` or build in Flow Builder
- **AI:** Settings → AI → paste OpenAI key, enable agent, set system prompt

## 6. CRM pipeline

Default Kanban stages (seeded): New Lead → Contacted → Interested → Negotiation → Won → Lost

## 7. Team roles

| Role | Access |
|------|--------|
| owner | Full tenant admin |
| admin | All except billing settings |
| manager | CRM, campaigns, automation; department chats |
| agent | Assigned chats only |
| support | Contacts + assigned chats |

Platform **Super Admin**: `users.role = admin` → `/admin` routes.

## Demo tenants (after `pnpm db:seed:production`)

| Workspace | Login | Password |
|-----------|-------|----------|
| tenant-1 | admin1@tenant.com | Tenant1Admin!2026 |
| tenant-2 | admin2@tenant.com | Tenant2Admin!2026 |
| tenant-3 | admin3@tenant.com | Tenant3Admin!2026 |

Change passwords before go-live.
