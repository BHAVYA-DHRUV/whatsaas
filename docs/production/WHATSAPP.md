# WhatsApp connection guide

## A) Evolution API (QR / Baileys)

1. Deploy Evolution API v2 (see `docker-compose.prod.yml` commented service).
2. Set `.env`: `EVOLUTION_API_URL`, `AUTHENTICATION_API_KEY`, webhook token.
3. In Evolution, set webhook URL: `{BASE_URL}/api/webhook/evolution`.
4. Per tenant, create instance name: `{slug}-wa` (e.g. `tenant-1-wa`).
5. Dashboard → Connect → scan QR.
6. Verify: send test message, check `webhook_events` table and chat inbox.

**Session recovery:** Evolution handles reconnect; monitor instance status in dashboard. Re-scan QR if `logout` event.

**Tests:** incoming/outgoing text, image, voice note (PTT), session disconnect/reconnect.

## B) Meta Cloud API

1. Meta Business verification + WhatsApp Business Account.
2. Admin → Channels → Meta Cloud: App ID, secret, webhook verify token.
3. Webhook URL: `{BASE_URL}/api/webhook/meta-cloud`
4. Per tenant: Meta signup flow (`/api/instance/meta-signup`) or manual token fields on instance.
5. Sync templates: Templates → Sync from Meta.
6. Campaigns require Meta template + `metaPhoneNumberId` on instance.

> **Note:** Meta Cloud plugin files may need to be enabled in `lib/plugins/registry.ts` if not bundled.

## Webhook security

- Evolution: validate token header against `NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN`
- Meta: `hub.verify_token` + signature validation on POST
- Never log full tokens in application logs

## Tenant isolation

Webhooks resolve `teamId` from `evolutionInstances.instanceName` — **unique instance names per tenant** are mandatory.
