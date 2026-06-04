# Implementation Plan — WhatsApp SaaS Evolution API Recovery

This plan details the diagnosis and structural changes required to resolve the WhatsApp connection loops (`close ↔ connecting`), HTTP `405` error reasons, and failures in QR code generation.

## Root Cause Analysis

Based on our infrastructure and code audit, the connection flapping and QR generation failures are caused by two primary issues:

1. **Outdated/Broken WhatsApp Web Version in Evolution API (`statusReason: 405`)**
   - The system runs the `atendai/evolution-api:v2.1.1` Docker image. 
   - During client initialization, Baileys calls its version utility which requests `https://web.whatsapp.com/sw.js` with `responseType: 'json'`. Because this is a Javascript file (not JSON), Axios throws a parse error and falls back to a hardcoded older WhatsApp Web client version in Baileys.
   - WhatsApp's servers have recently deprecated older client versions (e.g. `2.24xx.xx`), closing the connection immediately with HTTP error **`405`** (Method Not Allowed) during handshake.
   - The Evolution API's Baileys service sees the `405` disconnect, determines that it is a reconnectable status, and immediately retries the connection. This leads to an infinite `close ↔ connecting` loop.
   - Because the socket keeps reconnecting in under a second, the QR code generation code limit is hit or never resolves, returning `count: 0` and never firing the `qrcode.updated` webhook.

2. **Frontend Connection Mismatch (`?instance=` vs `?instanceName=`)**
   - In `components/whatsapp/ConnectWhatsAppModal.tsx`, the fetch call uses the query parameter `?instance=...` but `app/api/instance/connect/route.ts` parses `?instanceName=...`. This causes the modal to fail with a `400 Bad Request` code when trying to load the QR code.

---

## User Review Required

> [!IMPORTANT]
> **Docker Version Upgrade**: We propose updating the Evolution API version in `docker-compose.yml` to build from the local `./evolution-api` folder, which contains version `2.3.7` (with newer Baileys support) or pulling a newer stable release. We will patch `fetchLatestWaWebVersion.ts` inside the Evolution API to resolve the Axios JSON parsing error and fallback to a verified modern stable version (e.g. `[2, 3000, 1017578272]`).

---

## Proposed Changes

### 1. Evolution API Configuration

#### [MODIFY] [fetchLatestWaWebVersion.ts](file:///d:/Live_Whatsapp_Project/whats-saas-main/evolution-api/src/utils/fetchLatestWaWebVersion.ts)
- Replace `responseType: 'json'` with `responseType: 'text'` in the Axios request to `https://web.whatsapp.com/sw.js`.
- Add support for the `CONFIG_SESSION_PHONE_VERSION` environment variable so that we can optionally override the version directly in `.env`.
- Change the fallback version from `(await fetchLatestBaileysVersion()).version` to a known stable WhatsApp Web version (e.g., `[2, 3000, 1017578272]`) if version parsing fails.

#### [MODIFY] [docker-compose.yml](file:///d:/Live_Whatsapp_Project/whats-saas-main/docker-compose.yml)
- Change `image: atendai/evolution-api:v2.1.1` to build the local `./evolution-api` codebase, or point it to a newer stable version, and inject the environment variable `CONFIG_SESSION_PHONE_VERSION=2.3000.1017578272` as a configuration safety net.

### 2. Next.js Webhook Validation

#### [MODIFY] [route.ts (Webhook)](file:///d:/Live_Whatsapp_Project/whats-saas-main/app/api/webhook/evolution/route.ts)
- Accept both `qrcode.updated` and `qr.updated` events.
- Safely extract the QR data from both `body.data.qrcode` and `body.data` payload structures.

### 3. QR Code Lifecycle & Manager

#### [NEW] [qr-manager.ts](file:///d:/Live_Whatsapp_Project/whats-saas-main/lib/whatsapp/qr-manager.ts)
- Implement `QRManager` to coordinate:
  - Memory caching of the QR state.
  - Redis caching of the QR state.
  - Multi-channel real-time emission via `pusherServer.trigger` to client sockets.
  - Invalidation of cached states upon connection changes.

#### [MODIFY] [route.ts (Connect)](file:///d:/Live_Whatsapp_Project/whats-saas-main/app/api/instance/connect/route.ts)
- Refactor to integrate with the new `QRManager` caching, locks, and automatic fallbacks.

### 4. Next.js Frontend Fixes

#### [MODIFY] [ConnectWhatsAppModal.tsx](file:///d:/Live_Whatsapp_Project/whats-saas-main/components/whatsapp/ConnectWhatsAppModal.tsx)
- Correct the query parameter mismatch by changing `/api/instance/connect?instance=` to `/api/instance/connect?instanceName=`.

---

## Verification Plan

### Automated Tests
- We will verify that Drizzle/Prisma schemas connect properly.
- We will execute the connection/QR diagnostic script to check the status of the local Evolution API.

### Manual Verification
1. Create a WhatsApp Web instance via the user dashboard.
2. Verify that a QR code is generated and displayed on the UI inside 5 seconds.
3. Scan the QR code with WhatsApp, and verify it updates dynamically in real-time to "Connected" and redirects to the inbox.
