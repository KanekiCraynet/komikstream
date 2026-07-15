# Maintenance Guide

KuroManga v2 maintenance notes for solo ops.

## Current status

All sprints complete (2026-07-07).
Sprint 6 — Hardening + Launch ✅ (patches applied 2026-07-07).

## File tree (current)

```
src/
├── app/
│   ├── manga/page.tsx             # listing all komik
│   ├── manga/[slug]/page.tsx      # detail + chapter list
│   ├── chapter/[id]/page.tsx      # reader page (passes tier to reader)
│   ├── komik/[mangaId]/[chapterId]/page.tsx  # → /chapter/[id] 301
│   ├── search/page.tsx            # ILIKE search, min query 2 chars
│   ├── bookmark/page.tsx          # bookmarks list (client, paginated)
│   ├── history/page.tsx           # reading history list (client, paginated)
│   ├── account/page.tsx           # preferences + delete account
│   ├── privacy/page.tsx           # privacy policy — Sprint 6
│   ├── dmca/page.tsx              # DMCA policy — Sprint 6
│   ├── contact/page.tsx           # contact form — Sprint 6
│   ├── terms/page.tsx             # Terms of Service — Sprint 6
│   ├── api/
│   │   ├── bookmarks/route.ts     # GET list, POST toggle
│   │   ├── history/route.ts       # GET list, POST upsert, DELETE
│   │   ├── img/route.ts           # image proxy (allowlist) — Sprint 6
│   │   ├── cache/purge/route.ts   # POST cache purge (x-cron-secret) — Sprint 6
│   │   ├── health/route.ts        # DB health check — Sprint 6
│   │   ├── push/subscribe/route.ts   # POST subscribe
│   │   ├── push/unsubscribe/route.ts # POST unsubscribe
│   │   └── webhooks/clerk/route.ts   # svix-verified user.deleted
│   ├── layout.tsx                 # Clerk provider + GdprBanner + metadata
│   ├── robots.ts                  # SEO baseline
│   ├── sitemap.ts                 # SEO baseline
│   └── page.tsx                   # landing (placeholder)
├── components/
│   ├── ads/
│   │   ├── BannerAd.tsx           # 90px placeholder
│   │   └── InterstitialAd.tsx     # 5s delay + dismiss
│   ├── GdprBanner.tsx             # localStorage consent banner — Sprint 6
│   ├── MangaReader.tsx            # reader + ad interleave by tier
│   └── PushNotificationToggle.tsx # subscribe/unsubscribe button
├── lib/
│   ├── clerk-flags.ts             # env-only Clerk flag (Edge-safe)
│   ├── auth.ts                    # getCurrentUserId + requireCurrentUserId + getUserTier
│   ├── db.ts                      # Prisma singleton (adapter-pg)
│   ├── progress.ts                # guest progress (localStorage, max 100)
│   ├── push.ts                    # VAPID init + sendNotification
│   ├── ipaymu.ts                  # iPaymu payment — Sprint 4
│   ├── actions/
│   │   ├── bookmark.ts            # toggleBookmark, listBookmarks, isBookmarked
│   │   ├── history.ts             # logged-in progress (DB upsert + FIFO 500)
│   │   ├── account.ts             # getPreferences, updatePreferences, deleteAccount
│   │   └── notification.ts        # subscribeUser, unsubscribeUser, getUserSubscriptions
│   └── validations/
│       ├── komik.ts               # KomikChaptersSchema, KomikGenresSchema
│       ├── chapter.ts             # ChapterImageSchema
│       └── user.ts                # UserPreferencesSchema
├── middleware.ts                   # Clerk auth (Edge-safe) — image proxy moved to /api/img
└── generated/prisma/              # Prisma client output
```

## Daily commands

```bash
pnpm run lint
pnpm exec tsc --noEmit
pnpm run build
pnpm exec prisma validate
```

## Prisma

- Schema: `prisma/schema.prisma`
- Client output: `src/generated/prisma`
- Config: `prisma.config.ts`
- Validate: `pnpm exec prisma validate`
- Drift check without live DB:

```bash
pnpm exec prisma migrate diff --exit-code --from-empty --to-schema prisma/schema.prisma
```

- Live DB drift check needs `DATABASE_URL` reachable.

## Reader component

File: `src/components/MangaReader.tsx`

4 modes:
- **vertical** — webtoon infinite scroll
- **horizontal** — page flip LTR
- **ltr** (book-style left-to-right)
- **rtl** (manga right-to-left)

Features:
- Keyboard navigation (← →)
- Sticky toolbar (top) with mode toggle + prev/next chapter
- Loading states per image
- Guest progress save (localStorage, max 100 entries)
- Logged-in progress save (DB `History` model via server action)

## Progress system

- **Guest**: localStorage key `ks_reading_progress`, FIFO max 100 entries.
  `src/lib/progress.ts` — get/set/delete, no side effects on server.
- **Logged-in**: `src/lib/actions/history.ts` — upsert via Prisma,
  auto-purge oldest when entries > 500 per user.
  Identity is derived from Clerk auth; callers cannot supply `userId`.

Both store `{ mangaId, mangaTitle, chapterId, chapterTitle, progress, updatedAt }`.

## Environment

Template: `.env.example`

Required groups:
- Auth: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Clerk webhook: `CLERK_WEBHOOK_SIGNING_SECRET`
- iPaymu: `IPAYMU_VA`, `IPAYMU_API_KEY`, `IPAYMU_URL`, `IPAYMU_SANDBOX`
- Web Push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Cache purge: `CRON_SECRET`

Not yet required (will not crash if missing):
- (none — all envs are gated by feature checks)

Never commit real `.env` values. `.gitignore` covers `.env*`.

## Middleware

File: `src/middleware.ts`

Current duty:
- Clerk auth handler (guarded by `clerkEnabled` flag)
- CSP headers on all routes:
  ```
  default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:;
  font-src 'self' data:; connect-src 'self' https:; frame-src 'none';
  object-src 'none'; base-uri 'self'; form-action 'self'
  ```

Note: image CDN allowlist moved to `src/app/api/img/route.ts` (Sprint 6).

## CI

Workflows: `.github/workflows/ci.yml`, `lighthouse.yml`, `codeql.yml`, `release.yml`

Current duty:
- checkout
- setup Node 22 via `.node-version`
- install pnpm deps
- CI runs lint, typecheck, Prisma checks, build, secret scan, and dependency review.
- Lighthouse and CodeQL run from dedicated workflows.

## Launch patch notes (2026-07-15)

Applied fixes:
- `package.json`: `build` is normal `next build` (no Turbopack production build)
- `next.config.ts`: `outputFileTracingRoot` + `turbopack.root` pin project root
- `/home/zee/package-lock.json`: deleted stray lockfile that confused Next workspace root
- `src/middleware.ts`: Clerk handler + global CSP
- `src/app/api/cache/purge/route.ts`: `timingSafeEqual` length guard
- `.env.example`: `CLERK_WEBHOOK_SIGNING_SECRET`, `CRON_SECRET`, `VAPID_SUBJECT`
- Reader progress uses source page index even when ads are interleaved.
- Manga detail reads canonical `komikChapter` relation.
- Consent copy matches localStorage-only behavior; Accept + Reject available.
- Push subscription toggles validate API responses and rollback browser state.
- Clerk 7.5.18, React 19.1.4, Hono 4.12.30, `@hono/node-server` 1.19.13.
- Azure and stale deployment workflows removed.

Verified:
- `pnpm run lint && pnpm run typecheck && pnpm run build` → exit 0
- `pnpm run build` → exit 0, 24 static pages, 30 routes
- Dev smoke: `/` 200, `/search` 200, `/bookmark` 200
- `/api/health` → 503 when local PostgreSQL is down (expected env issue)
- `/api/cache/purge`: missing/wrong secret 403; valid secret + `{"type":"komik"}` 200; missing type 400
- Dependabot open alerts: 0. `pnpm audit` currently returns HTTP 410 and is not authoritative.

Known limitations:
- Local DB must be running for `/api/health` and DB-backed routes.
- `CRON_SECRET` must exist at runtime for `/api/cache/purge`.
- `metadataBase` warns/falls back to `http://localhost:3000` until production domain is set.
- `next.config.ts` currently has no `images.remotePatterns`; restore if remote manga images fail.

## Sprint 1 delivered

| Task | Status |
|------|--------|
| `/manga` listing | ✅ |
| `/manga/[slug]` detail | ✅ |
| `/chapter/[id]` reader | ✅ |
| Reader (4 modes + kbd nav + progress) | ✅ |
| Guest progress (localStorage) | ✅ |
| Logged-in progress (DB, FIFO 500) | ✅ |
| `/komik/{mangaId}/{chapterId}` → `/chapter/[id]` 301 | ✅ |
| SEO baseline (meta, OG, sitemap, robots) | ✅ |
| Gate (lint 0, tsc 0, build pass) | ✅ |

## Sprint 2 delivered

| Task | Status |
|------|--------|
| Clerk graceful degrade (`src/lib/clerk-flags.ts`) | ✅ |
| Protected routes (/bookmark, /history, /account, /api/bookmarks, /api/history) | ✅ |
| Bookmark CRUD (contentType only `komik`) | ✅ |
| History CRUD + FIFO 500 | ✅ |
| Account page (theme, delete cascade) | ✅ |
| Privacy page (`/privacy`) | ✅ |
| Clerk webhook (svix-verified user.deleted) | ✅ |
| Edge build fix (split env flag from Prisma import chain) | ✅ |
| Gate (lint 0, tsc 0, build pass) | ✅ |

## Sprint 3 delivered

| Task | Status |
|------|--------|
| `public/ads.txt` — AdSense placeholder | ✅ |
| `BannerAd` component (90px placeholder) | ✅ |
| `InterstitialAd` component (5s delay + dismiss) | ✅ |
| `getUserTier()` server fn in `auth.ts` | ✅ |
| Chapter page passes tier to reader | ✅ |
| Free: banner every 5 pages + interstitial on last page | ✅ |
| Premium: zero ad DOM | ✅ |
| Native `<img>` (Next `<Image>` breaks dynamic CDN lazy-load) | ✅ |
| Gate (lint 0, tsc 0) | ✅ |
