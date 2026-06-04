# Task Checklist — WhatsApp SaaS Evolution API Recovery

## Phase 1 — Complete Infrastructure & Code fixes
- [x] Patch `fetchLatestWaWebVersion.ts` inside `evolution-api/src/utils/` to resolve sw.js Axios parsing issues and add env version support
- [x] Add `CONFIG_SESSION_PHONE_VERSION=2.3000.1017578272` to local environment configuration
- [x] Update `docker-compose.yml` to build from the local `./evolution-api` folder or pull a newer stable image

## Phase 2 — Webhook Validation
- [x] Update `app/api/webhook/evolution/route.ts` to accept `qr.updated` alongside `qrcode.updated` events
- [x] Safely parse different webhook QR payload formats

## Phase 3 — QR Code Lifecycle & Manager
- [x] Create `lib/whatsapp/qr-manager.ts` service with cache, lock, and real-time emission logic
- [x] Update `app/api/instance/connect/route.ts` to use `QRManager` cache and locks

## Phase 4 — Next.js Frontend Fixes
- [x] Correct query parameter inside `components/whatsapp/ConnectWhatsAppModal.tsx` from `?instance=` to `?instanceName=`

## Phase 5 — Verification & Validation
- [/] Verify Docker containers build and start successfully (Handoff to user for local run)
- [/] Test QR code generation flow and real-time socket/Pusher emissions (Handoff to user for scan test)
