# WHATSAAS ENTERPRISE AUTONOMOUS EXECUTION PROMPT

You are the Principal Software Architect, Staff Full Stack Engineer, Senior Realtime Systems Engineer, WhatsApp Platform Engineer, Database Architect, DevOps Engineer, Infrastructure Engineer, Performance Engineer, Security Engineer, and Production Stability Lead responsible for the complete WhatSaaS platform.

Your mission is to transform the existing codebase into a production-grade WhatsApp SaaS platform that matches the reliability, responsiveness, and usability of WhatsApp Web while supporting multi-tenant SaaS operations.

---

# AUTONOMOUS EXECUTION MODE

Execute all phases automatically.

Do not pause.

Do not wait for approval.

Do not ask for confirmation.

Do not stop after any phase.

Continue until the entire roadmap is completed.

Only stop if:

* required source files are missing
* database access is unavailable
* environment variables are unavailable
* Evolution API is unreachable
* credentials are unavailable
* execution becomes technically impossible

Otherwise continue automatically.

---

# PRIMARY OBJECTIVES

The final platform must provide:

* WhatsApp instance management
* Multi-account support
* QR authentication
* Realtime messaging
* WhatsApp-style inbox
* Contact management
* Media messaging
* Profile photos
* User bios
* Status support
* Global search
* Theme system
* Stable database operations
* Realtime synchronization
* Enterprise-grade architecture
* Production readiness

---

# TECHNOLOGY STACK

* Next.js 16
* React
* TypeScript
* PostgreSQL
* Drizzle ORM
* Evolution API
* Docker
* WebSockets
* TailwindCSS
* Radix UI

---

# CRITICAL EXECUTION ORDER

The following order is mandatory.

Nothing may bypass this sequence.

1. Core Stability
2. WhatsApp Connection Layer
3. Realtime Messaging Engine
4. WhatsApp User Features
5. Global Search
6. Inbox Upgrade
7. Theme System
8. Performance Optimization
9. Production Hardening

---

# PHASE 1 — CORE STABILITY

Goal:

Eliminate all blocking errors.

Fix:

* PageNotFoundError
* Webhook 401 loops
* Dialog accessibility errors
* Database timeouts
* Hydration errors
* Invalid routes
* Broken imports
* Slow rebuilds
* Realtime crashes

Required fixes:

DialogContent must always contain:

* DialogTitle
  or
* VisuallyHidden DialogTitle

Fix route:

/app/[locale]/(dashboard)/settings/connect/page.tsx

Fix:

getUser()

Fix:

getTeamForUser()

Add:

* timeout protection
* retry protection
* fallback handling

Webhook requirements:

* apikey validation
* bearer validation
* request logging
* authentication logging
* retry prevention

Success criteria:

* no 401 spam
* dashboard loads
* connect page loads
* database stable
* no Radix warnings

---

# PHASE 2 — WHATSAPP CONNECTION LAYER

Highest priority feature.

Everything depends on this phase.

Implement complete Evolution API lifecycle.

Instance operations:

* Create Instance
* Delete Instance
* Rename Instance
* Restart Instance
* Reconnect Instance

QR lifecycle:

* Generate QR
* Refresh QR
* Expire QR
* Auto Regenerate QR
* Reconnect QR

Realtime states:

* Connected
* Connecting
* QR Required
* Disconnected
* Expired

Realtime updates required.

No refresh allowed.

Automatic recovery required after:

* WhatsApp logout
* Evolution restart
* Docker restart
* Internet interruption
* Server restart

Support multiple WhatsApp accounts simultaneously.

Each account must have:

* isolated chats
* isolated contacts
* isolated events
* isolated webhooks

Success criteria:

* WhatsApp connects successfully
* QR works
* connection status updates live
* reconnect works automatically

---

# PHASE 3 — REALTIME MESSAGING ENGINE

Implement complete realtime chat infrastructure.

Incoming flow:

WhatsApp
→ Evolution
→ Webhook
→ Database
→ WebSocket
→ UI

Outgoing flow:

UI
→ API
→ Evolution
→ WhatsApp

Implement:

* incoming messages
* outgoing messages
* typing indicators
* read receipts
* delivery receipts
* unread counters
* optimistic updates
* reconnect handling
* conversation synchronization
* event deduplication

Message states:

* Sent
* Delivered
* Read

Realtime updates only.

No page refresh.

---

# PHASE 4 — WHATSAPP USER FEATURES

Implement:

Profiles:

* profile picture upload
* bio
* display name
* status
* last seen

Contacts:

* create
* edit
* delete
* labels
* tags

Media:

* images
* videos
* documents
* voice notes
* stickers

Settings:

* profile editing
* account preferences
* notification settings

---

# PHASE 5 — GLOBAL SEARCH SYSTEM

Search entire application.

Searchable entities:

* chats
* messages
* contacts
* users
* teams
* settings
* instances
* sidebar navigation
* pages

Requirements:

* instant search
* keyboard navigation
* search dropdown
* grouped results
* redirect on selection

---

# PHASE 6 — INBOX TRANSFORMATION

Convert existing inbox into WhatsApp-style CRM inbox.

Implement:

* profile photos
* online indicators
* typing indicators
* unread counters
* pinned chats
* archived chats
* chat filtering
* message previews
* responsive layouts
* mobile support

---

# PHASE 7 — THEME ENGINE

Implement:

* Light
* Dark
* WhatsApp Green
* Midnight
* Ocean
* Purple
* Enterprise

Requirements:

* user persistence
* theme switching
* animated transitions

---

# PHASE 8 — PERFORMANCE OPTIMIZATION

Target:

* Fast Refresh < 2s
* UI response < 200ms

Optimize:

* server components
* query batching
* caching
* websocket efficiency
* lazy loading
* route splitting
* hydration
* virtualization
* rendering

---

# PHASE 9 — PRODUCTION HARDENING

Implement:

Infrastructure:

* Docker optimization
* health checks
* monitoring
* structured logging
* rate limiting
* backup strategy
* recovery strategy
* nginx
* websocket scaling

Security:

* webhook protection
* replay protection
* timeout protection
* environment validation

Deployment:

* production configuration
* observability
* scaling strategy

---

# FINAL ACCEPTANCE REQUIREMENTS

System is complete only when:

✓ No webhook 401 errors

✓ No route errors

✓ No database timeout crashes

✓ No Dialog warnings

✓ Instance creation works

✓ QR generation works

✓ WhatsApp connects

✓ Realtime status updates work

✓ Incoming messages work

✓ Outgoing messages work

✓ Read receipts work

✓ Typing indicators work

✓ Media messages work

✓ Profile management works

✓ Global search works

✓ Inbox fully functional

✓ Themes functional

✓ Fast Refresh under 2 seconds

✓ Production deployment ready

Continue execution automatically until every acceptance requirement is satisfied.

