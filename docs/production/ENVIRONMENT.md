# Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | Yes | PostgreSQL connection string (app uses this, not `DATABASE_URL`) |
| `AUTH_SECRET` | Yes | Session encryption (32+ bytes hex) |
| `BASE_URL` | Yes | Public app URL, no trailing slash |
| `CRON_SECRET` | Yes | Bearer token for `/api/campaigns/process` |
| `REDIS_URL` | Prod multi-node | Redis for health + future distributed queues |
| `EVOLUTION_API_URL` | Evolution channel | Evolution API base URL |
| `AUTHENTICATION_API_KEY` | Evolution | Global Evolution API key |
| `NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN` | Evolution | Webhook validation secret |
| `OPENAI_API_KEY` | AI | Platform default; tenants can set own key in UI |
| `STRIPE_*` | Billing | Secret key + webhook secret + publishable key |
| `RAZORPAY_*` | Billing | Key ID, secret, webhook secret |
| `PUSHER_*` | Realtime | App ID, key, secret, cluster |
| `RESEND_API_KEY` | Email | Transactional email |
| `HEALTH_ALERT_WEBHOOK_URL` | Optional | Slack/Telegram webhook for health worker |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
