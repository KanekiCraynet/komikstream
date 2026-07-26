# Migrasi Next.js 15 → React Router 7

Branch: `migration/react-router-v7` · Strategi: **incremental vertical slice** — `app/` (RR7) jadi target, route diport satu per satu.

**Status: SELESAI.** Semua route sudah diport dan `src/` (Next.js legacy) sudah
dihapus dari git (`git ls-files src/` = 0). Yang tersisa di disk hanyalah
`src/generated/prisma` (artefak generate, gitignored) — aman dihapus. Sumber Next
lama bisa dilihat lewat history: `git show 7801f84^:src/app/...`.

## Keputusan teknis

| Area | Next 15 (lama) | RR7 (baru) |
|------|----------------|------------|
| Framework | App Router, Turbopack | RR7 framework mode, Vite 8 |
| SSR | RSC + server components | loader/action per route, SSR on (`react-router.config.ts`) |
| Auth | `@clerk/nextjs` middleware | `@clerk/react-router` 3.5.12, `rootAuthLoader` |
| Styling | Tailwind 4 via PostCSS | Tailwind 4 via `@tailwindcss/vite` |
| Prisma output | `src/generated/prisma` | `app/generated/prisma` (gitignored, regen saat build) |
| Path alias | `@/*` → `src/*` | `~/*` → `app/*` |
| Test | (coverage CI lama) | Vitest lokal |
| Deploy | CF Worker (OpenNext) | Netlify (`@netlify/vite-plugin-react-router`) |

Catatan runtime:
- `react-router-serve` **tidak load `.env`** — `DATABASE_URL` harus inline/exported.
- Local dev DB: docker `postgres:16-alpine` port `55432`.
- `tsconfig.json` exclude `src/` — legacy Next tidak ikut typecheck.

## Status port route

Ported (semua route utama — paritas fungsional dengan Next app):

Pages: home, manga index, manga/:slug, chapter/:chapterId, search, bookmark,
history, account, sign-in, sign-up, contact, dmca, privacy, terms.
API: history, bookmarks, health, push/subscribe, push/unsubscribe,
subscription/create, subscription/status, subscription/webhook, webhooks/clerk.

Catatan arsitektur:
- Clerk: `clerkMiddleware` + `rootAuthLoader` di `root.tsx`, `ClerkProvider`
  hanya aktif bila `CLERK_PUBLISHABLE_KEY`+`CLERK_SECRET_KEY` di-set
  (fail-open ke guest mode, paritas `clerkEnabled` lama). Sign-in/up render
  placeholder saat disabled (Clerk components crash tanpa provider).
- `auth.server.ts`: `getCurrentUserId()` upsert user DB dari Clerk (paritas
  `src/lib/auth.ts`), email via Clerk Backend API.
- `subscription.server.ts`: status/cancel/activate/expire — idempotent
  webhook replay guard dibawa utuh.
- `ipaymu.server.ts`: + `createRedirectPayment` (APP_URL env, bukan
  NEXT_PUBLIC_APP_URL).
- `push.server.ts`: VAPID env tanpa prefix NEXT_PUBLIC.
- Middleware type cast di root.tsx (`ponytail:` comment) — Clerk bundle
  react-router type copy sendiri; buang saat Clerk update peer range.

Belum diport (nonesensial):

- `api/img` (image proxy) — perlu keputusan caching/CDN dulu
- `api/cache/purge` (CRON_SECRET) — infra Next-specific, mungkin drop
- Legacy `komik/[mangaId]` pages — redirect atau drop (URL scheme baru)
- `GdprBanner`, `PushNotificationToggle`, ads components — UI opsional

## Verifikasi E2E terakhir (2026-07-26, batch 2)

```
14 pages (incl. /account /sign-in /sign-up)                        200
/manga/nope                                                        404
GET /api/health -> {"status":"healthy","checks":{"database":"connected"}}
GET/POST /api/bookmarks guest    200 (empty/{bookmarked:false} — parity lama)
POST /api/push/subscribe bad     400
POST /api/subscription/create    503 PAYMENT_DISABLED
GET  /api/subscription/status    401 AUTH_DISABLED
POST /api/webhooks/clerk         200 (clerk disabled passthrough)
POST /api/history unauth         401
```

Server: `react-router-serve` port 43700, DB postgres:16-alpine port 55432,
seed via `node --experimental-strip-types prisma/seed.ts` (butuh `DATABASE_URL` di env).
Typecheck clean, vitest 4/4, build OK.

## Sisa pekerjaan

1. CSP headers (dulu di Next middleware) → RR7 `entry.server` / Netlify headers
2. Redirect legacy `komik/[mangaId]` → `manga/:slug` (atau drop)
3. `api/img` proxy + `PushNotificationToggle`/`GdprBanner` UI bila dibutuhkan
4. Netlify preview deploy verification + set env production (Clerk, iPaymu, VAPID, APP_URL)
5. Verifikasi flow auth nyata dengan Clerk keys (E2E sekarang guest-mode saja)
