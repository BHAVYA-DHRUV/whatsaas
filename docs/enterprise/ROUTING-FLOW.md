# Routing flow (locale + app paths)

## Problem

URLs like `/dashboard` were treated as `[locale]=dashboard` by Next.js.  
Using `/en/dashboard` in the browser caused **307 redirect loops** with `next-intl` (`localePrefix: 'as-needed'`) stripping `/en` while middleware re-added it.

## Solution

1. **`localePrefix: 'never'`** — browser URLs never show `/en`; locale lives only on internal rewrites.
2. **Middleware rewrite** for app paths — `/dashboard` → internal `/en/dashboard` with `X-NEXT-INTL-LOCALE`.
3. **Skip `next-intl` middleware** on app paths (only our rewrite runs).
4. **Server redirects** use `next/navigation` (not i18n `redirect`) for onboarding/pricing gates.
5. **Removed `app/page.tsx`** — it redirected `/` → `/en`, which fought intl and caused home-page loops.

## Request flow

```
Browser: GET /dashboard
    │
    ▼
middleware.ts
    ├─ resolveInternalAppPath → /en/dashboard
    ├─ rewriteWithLocale(/en/dashboard)     ← 200, no 307
    ├─ X-NEXT-INTL-LOCALE: en
    ├─ x-pathname: /dashboard
    └─ session cookie refresh
    │
    ▼
app/[locale]/(dashboard)/layout.tsx (Server)
    ├─ setRequestLocale(en) in [locale]/layout
    ├─ Read x-pathname
    ├─ !onboardingCompletedAt? → redirect /onboarding
    ├─ !planId? → redirect /pricing
    └─ DashboardShell + page
```

## Public URLs

| Browser URL | Internal rewrite |
|-------------|------------------|
| `/` | intl middleware → `/en` (rewrite) |
| `/dashboard` | `/en/dashboard` |
| `/inbox` | `/en/inbox` |
| `/pt/dashboard` | `/pt/dashboard` |
| `/sign-in` | `/en/sign-in` |

## Auth & onboarding

| Step | Where |
|------|--------|
| No session on protected route | Middleware → `/sign-in` |
| After sign-in | Server action → `/dashboard` or `/onboarding` |
| Onboarding incomplete | Server layout → `/onboarding` |
| No plan | Server layout → `/pricing` |
| Wizard done (timestamp set) | `router.replace('/dashboard')` |

## After code changes

1. Restart dev server: `npm run dev`
2. Hard refresh (Ctrl+Shift+R)
3. `curl.exe -sI http://localhost:3000/dashboard` — expect **307 → /sign-in** if logged out, or **200** with session cookie
