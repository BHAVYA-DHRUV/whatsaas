# Security checklist

## Application

- [ ] Rotate `AUTH_SECRET`, `CRON_SECRET`, API keys before production
- [ ] Use `POSTGRES_URL` with least-privilege DB user (not `postgres` superuser)
- [ ] Enable `CRON_SECRET` on `/api/campaigns/process`
- [ ] Configure Stripe/Razorpay webhook secrets
- [ ] Validate Evolution/Meta webhook signatures
- [ ] Rate limiting via NGINX (`infra/nginx/whats-saas.conf`)
- [ ] Hide stack traces: `NODE_ENV=production`
- [ ] Restrict `/admin` to platform admins only
- [ ] Per-route `teamId` checks on all `/api/*` routes
- [ ] Unique Evolution instance names per tenant
- [ ] File upload size limits (NGINX `client_max_body_size`)
- [ ] JWT/session cookies: `Secure`, `HttpOnly`, `SameSite` (Next.js defaults in prod)

## Server

- [ ] UFW: deny all except 22, 80, 443
- [ ] SSH: key-only, disable root login
- [ ] Fail2ban: sshd + nginx-limit-req
- [ ] Auto security updates (`unattended-upgrades`)
- [ ] Admin IP allowlist on `/admin` (NGINX `allow`/`deny`)

## Secrets

- [ ] Never commit `.env`
- [ ] Store backups encrypted at rest
- [ ] Stripe keys: live vs test separation

## Ongoing

- [ ] Weekly dependency updates (`pnpm audit`)
- [ ] Review `execution_logs` and `webhook_events` for abuse
- [ ] Monitor failed login / webhook spikes
