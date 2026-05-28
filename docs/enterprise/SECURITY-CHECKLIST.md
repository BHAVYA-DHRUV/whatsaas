# Phase 14 — Security Checklist

## Application

- [ ] `AUTH_SECRET` — 32+ byte random hex
- [ ] `CRON_SECRET` — protects campaign processor
- [ ] Evolution webhook apikey validation enabled
- [ ] Stripe/Razorpay webhook secrets configured
- [ ] `NODE_ENV=production` on VPS
- [ ] Session cookies: httpOnly, secure, sameSite=lax
- [ ] Tenant guard on new API routes
- [ ] File upload size limits (NGINX 25M)
- [ ] No secrets in git (.env gitignored)

## Server

- [ ] UFW: 22, 80, 443 only
- [ ] Fail2ban: sshd + nginx
- [ ] SSH key-only, no root login
- [ ] Cloudflare WAF (optional)
- [ ] Admin IP allowlist on `/admin` (NGINX)

## Operations

- [ ] Daily encrypted backups
- [ ] DLQ alerts via `HEALTH_ALERT_WEBHOOK_URL`
- [ ] Dependency audit: `npm audit`
