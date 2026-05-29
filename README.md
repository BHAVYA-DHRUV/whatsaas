# Next.js WhatSaaS

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

Full Windows install guide: [docs/INSTALLATION.md](docs/INSTALLATION.md)

```bash
pnpm install
```

## Running Locally

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Run database bootstrap (migrate + recovery + seed user + plans + branding):

```bash
pnpm db:bootstrap
```

Or step by step:

```bash
pnpm db:migrate
pnpm db:recovery
pnpm db:seed
pnpm db:seed:plans
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

You can listen for Stripe webhooks locally through their CLI to handle subscription change events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Database stabilization

If you see errors like `plans.gateway_id does not exist`, migration `0001` removed the column while the app still expects it.

```bash
pnpm db:migrate
pnpm db:recovery
pnpm db:audit
```

- `pnpm db:recovery` — idempotent SQL fix (`scripts/db/migrate-recovery.sql`)
- `pnpm db:audit` — writes `docs/enterprise/SCHEMA-AUDIT.md` from live Postgres

See `docs/enterprise/SCHEMA-AUDIT.md` and `docs/enterprise/ARCHITECTURE-AUDIT.md`.

## Production deployment

See [docs/PRODUCTION-DEPLOYMENT.md](docs/PRODUCTION-DEPLOYMENT.md) for Docker, PM2, Nginx, Redis caching, and performance tuning.

## Testing Payments

To test Stripe payments, use the following test card details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

# whatsaas
# Next.js WhatSaaS

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

Full Windows install guide: [docs/INSTALLATION.md](docs/INSTALLATION.md)

```bash
pnpm install
```

## Running Locally

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Run database bootstrap (migrate + recovery + seed user + plans + branding):

```bash
pnpm db:bootstrap
```

Or step by step:

```bash
pnpm db:migrate
pnpm db:recovery
pnpm db:seed
pnpm db:seed:plans
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

You can listen for Stripe webhooks locally through their CLI to handle subscription change events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Database stabilization

If you see errors like `plans.gateway_id does not exist`, migration `0001` removed the column while the app still expects it.

```bash
pnpm db:migrate
pnpm db:recovery
pnpm db:audit
```

- `pnpm db:recovery` — idempotent SQL fix (`scripts/db/migrate-recovery.sql`)
- `pnpm db:audit` — writes `docs/enterprise/SCHEMA-AUDIT.md` from live Postgres

See `docs/enterprise/SCHEMA-AUDIT.md` and `docs/enterprise/ARCHITECTURE-AUDIT.md`.

## Production deployment

See [docs/PRODUCTION-DEPLOYMENT.md](docs/PRODUCTION-DEPLOYMENT.md) for Docker, PM2, Nginx, Redis caching, and performance tuning.

## Testing Payments

To test Stripe payments, use the following test card details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number
