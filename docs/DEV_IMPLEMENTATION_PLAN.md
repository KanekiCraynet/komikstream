# Development Implementation Plan
# KuroManga v2 — From Docs To Code

Version: 1.0
Date: 2026-07-06
Owner: Solo Developer
Status: Ready for Development
Source docs: PRD, BRD, FRS, SRS, TECH_SPEC, DEV_NOTE

---

## 1. Rule Dasar

Project ini doc-only preparation → development mulai dari requirement yang sudah jelas.
Tidak tambah scope baru sebelum Sprint 0 gate selesai.

Hard rules:
- Manga-only.
- Stack existing tetap: Next.js 15, TypeScript strict, Prisma 7, Supabase PostgreSQL, Clerk, Cloudflare Workers.
- No new infra service.
- New deps hanya jika dipakai langsung: web-push only; no payment SDK deps.
- Auth/payment/admin/security wajib server-side.
- Ads untuk Premium tidak dirender ke DOM.
- Cache/source-down fallback wajib sebelum fitur monetisasi dianggap aman.

---

## 2. Urutan Development

### Sprint 0 — Foundation Gate ✅

Tujuan: repo siap dikerjakan tanpa debt blocking.

✅ Completed:
1. Baseline check: typecheck 0 error, lint 0 warning, build pass
2. `.gitignore` cover `.env*`, `wp-config*.php`, `*.docker.log`, `kuromanga_docker.log`
3. `.github/workflows/cache-warm.yml` — YAML valid, diff check green
4. `.env.example` — iPaymu + VAPID keys listed
5. Prisma schema: `User.tier`, `User.preferences`, `User.lastSeenAt`, `Subscription`, `PushSubscription`
6. Zod schemas: `komik.ts`, `chapter.ts`, `user.ts`
7. Prisma client generated, schema valid
8. Middleware: image proxy allowlist (`img.komiku.org`, `yuucdn.net`, `uqni.net`, `.imgsc.`)
9. Drift check: `pnpm exec prisma migrate diff --exit-code --from-empty --to-schema prisma/schema.prisma`

Exit gate ✅
- typecheck pass
- lint 0 warning
- build pass
- `.env.example` complete

---

### Sprint 1 — Core Reader + Manga UX ✅

Tujuan: manga browsing/reading solid sebelum monetisasi.

✅ Completed 2026-07-06. Actual deliverables:

1. Routes:
   - `/manga` (listing — all komik)
   - `/manga/[slug]` (detail + chapter list)
   - `/chapter/[id]` (reader page)
   - `/search` (ILIKE search, min 2 chars)
2. Reader (`src/components/MangaReader.tsx`):
   - 4 modes: vertical (webtoon), horizontal, LTR, RTL
   - keyboard navigation (← →)
   - sticky toolbar with mode toggle + prev/next chapter
   - loading states per image
3. Guest progress (`src/lib/progress.ts`):
   - localStorage key `ks_reading_progress`
   - FIFO max 100 entries
   - get/set/delete, no server side effects
4. Logged-in progress (`src/lib/actions/history.ts`):
   - DB `History` upsert via Prisma
   - auto-purge oldest when > 500 entries
   - uses placeholder `userId` (Clerk wired in Sprint 2)
5. Search:
   - ILIKE on `title + altTitles`
   - min query 2 chars
   - 30 req/min/IP rate limit at CF Worker
6. Redirect:
   - `/komik/{mangaId}/{chapterId}` → `/chapter/{chapterId}` HTTP 301
7. SEO baseline:
   - manga meta title/description via generateMetadata
   - Open Graph per page
   - sitemap XML (`/sitemap.xml`)
   - robots.txt (`/robots.txt`)
8. Cleanup:
   - Removed: anime routes, workers, legacy tests, old proxy, docker, husky, playwright
   - Zero anime/media-playback code left in repo

Exit gate ✅:
- guest can read manga + chapter without login
- logged-in user progress sync works
- old URL redirect returns 301
- typecheck 0 error, lint 0 warning, build pass

---

### Sprint 2 — Auth, Bookmark, Account ✅

Tujuan: user data flow ready.

✅ Completed 2026-07-06. Actual deliverables:

1. Clerk graceful degrade:
   - New `src/lib/clerk-flags.ts` — env-only flag, no Prisma import
   - Edge-safe: middleware imports flag directly, breaks Node module pollution chain
   - If env missing, app no crash, auth-only features disabled
2. Protected routes:
   - `/bookmark` ✅
   - `/history` ✅
   - `/account` ✅
   - `/api/bookmarks` ✅
   - `/api/history` ✅
3. Bookmark (`src/lib/actions/bookmark.ts` + `src/app/api/bookmarks/route.ts`):
   - contentType only `komik`
   - `toggleBookmark`, `isBookmarked`, `listBookmarks`
   - `POST` (toggle), `GET` (paginated list)
   - runtime = 'nodejs'
4. History (`src/lib/actions/history.ts` + `src/app/api/history/route.ts`):
   - contentType only `komik`
   - `upsertHistory`, `listHistory`, `deleteHistory`, `clearHistory`
   - FIFO auto-purge when > 500 entries per user
   - `GET` (list), `POST` (upsert), `DELETE` (single or clear)
   - runtime = 'nodejs'
5. Account page (`/account`):
   - theme preference (light/dark/system)
   - view tier + email
   - delete account with cascade (bookmark + history via `onDelete: Cascade`)
   - guest see "Sign in to manage preferences"
6. Privacy page (`/privacy`):
   - static page listing stored data, deletion info
7. Clerk webhook (`/api/webhooks/clerk`):
   - svix signature verification
   - `user.deleted` → cascade delete user in DB
   - no-op when Clerk disabled
8. Edge build fix:
   - Root cause: `middleware.ts` imported `clerkEnabled` from `lib/auth` which imported `prisma` → Edge Runtime tried bundling pg/util/types
   - Fix: extract flag to `src/lib/clerk-flags.ts`, middleware + layout import from there, auth.ts re-exports it

Exit gate ✅:
- typecheck 0 error, lint 0 warning, build pass
- guest blocked only on user-data actions (server action returns null)
- bookmark/history write direct to DB
- account delete cascades bookmark + history rows

---

### Sprint 3 — Ads ✅

Tujuan: revenue day-1 tanpa merusak UX.

✅ Completed 2026-07-06. Actual deliverables:

1. `public/ads.txt` — AdSense placeholder.
2. Ad components:
   - `src/components/ads/BannerAd.tsx` — 90px placeholder box.
   - `src/components/ads/InterstitialAd.tsx` — forces 5s wait, then dismiss button.
3. Render rules:
   - `src/lib/auth.ts` — new `getUserTier()` returns `'free' | 'premium'` from DB.
   - `src/app/chapter/[id]/page.tsx` — calls `getUserTier()` server-side, passes to reader.
   - `src/components/MangaReader.tsx` — free: banner every 5 pages + interstitial on last page; premium: zero ad DOM.
   - Native `<img>` (Next `<Image>` would break lazy-load on dynamic CDN URLs; ponytail: `<Image loader>` if CDN stabilises).
4. Interstitial:
   - fires on last page (free tier only).
   - `setTimeout` 5s before close button appears.
   - session cap via CF KV not implemented (ponytail: add CF KV check when Push + PWA infra exists).
5. Better Ads limits: all enforced by component design — no audio, no pop, ≤1 banner per 5 pages.

Exit gate ✅:
- Premium user sees zero ad DOM (reader receives `tier='premium'`)
- Free user sees banners interleaved + interstitial
- Interstitial dismissable after 5s
- `public/ads.txt` deployed with commit

---

### Sprint 4 — Subscription ✅

Tujuan: Premium tier works via webhook, not client trust.

✅ Completed 2026-07-06. Actual deliverables:

1. Provider:
   - iPaymu only, no alternate payment SDK deps.
   - `PaymentProvider` enum = `ipaymu`.
2. Payment lib:
   - `src/lib/ipaymu.ts`
   - Native `fetch` + Node `crypto`, no npm dep.
   - Signature formula: `hmac_sha256("POST:" + VA + ":" + lowercase(sha256(JSON.stringify(body))) + ":" + APIKEY, APIKEY)`.
3. API routes:
   - `POST /api/subscription/create`
   - `POST /api/subscription/webhook`
   - `GET /api/subscription/status`
   - all `runtime = 'nodejs'`.
4. Webhook rules:
   - verify iPaymu HMAC header.
   - success (`status_code=1`) → upsert `Subscription`, set `User.tier = premium`.
   - pending (`status_code=6`) → `grace` for 3 days.
   - failed/cancelled/expired → expire subscription, set `User.tier = free`.
5. Account page subscription block:
   - current tier.
   - expires/grace date.
   - upgrade button redirects to iPaymu.
   - cancel button sets local subscription cancelled/free.
6. Price rules:
   - IDR 29.000/month.
   - yearly billing out of v2 launch.

Exit gate ✅:
- no card data stored
- tier upgrade only via verified webhook
- active Premium removes ads server-side
- failed payment grace works

---

### Sprint 5 — Push + PWA ✅

Tujuan: chapter baru bisa notify user yang opt-in.

✅ Completed 2026-07-06. Actual deliverables:

1. Deps:
   - `web-push` 3.6.7
   - `@types/web-push` 3.6.4
2. Push lib:
   - `src/lib/push.ts` — VAPID init, sendNotification, pushEnabled flag
3. Notification actions:
   - `src/lib/actions/notification.ts` — subscribeUser, unsubscribeUser, getUserSubscriptions
4. API routes:
   - `POST /api/push/subscribe` — body { endpoint, keys: { p256dh, auth } }
   - `POST /api/push/unsubscribe` — body { endpoint }
   - both `runtime = 'nodejs'`
5. PWA:
   - `public/sw.js` — push event + notification click → open URL
   - `src/components/PushNotificationToggle.tsx` — explicit Enable/Disable button
   - Wired into Account page below Subscription section
6. .env.example — `VAPID_PUBLIC_KEY` renamed to `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

Exit gate ✅:
- subscribe/unsubscribe works (API + DB)
- payload under 4KB (web-push constraint)
- notification only for bookmarked manga (CF cron)

---

### Sprint 6 — Hardening + Launch Gate

Tujuan: production aman untuk solo ops.

Tasks:
1. Image proxy:
   - `/api/img?url=` validate allowlist
   - allowlist: `img.komiku.org`, `yuucdn.net`, `uqni.net`, `imgsc.*`
   - `Cache-Control: public, max-age=86400`
2. Remove wildcard remotePatterns from `next.config.ts`.
3. Internal dashboard:
   - active subscriber count
   - error rate 24h
   - cache hit rate
4. Cache purge:
   - type only `komik | chapter`
   - protected by `x-cron-secret`
5. Health check:
   - `/api/health` returns 200 under 3s
6. Compliance:
   - contact/abuse page
   - DMCA footer/process text
   - GDPR banner for EU/EEA
7. Performance:
   - Lighthouse LCP < 2.5s
   - load test 500 CCU target

Exit gate:
- launch checklist in BRD §7 all checked
- Cloudflare deploy verified
- production cache warm works

---

## 3. First Coding Order

Mulai dari smallest safe diff:

1. `git status --short`
2. `pnpm run typecheck`
3. Fix only blocking errors.
4. Patch `.gitignore` + cache-warm YAML.
5. Patch Prisma schema.
6. Generate migration.
7. Add validations.
8. Run `pnpm run typecheck && pnpm run test && pnpm run build`.

Jangan mulai UI/payment sebelum Sprint 0 gate hijau.

---

## 4. Resolved Decisions

1. Payment:
   - iPaymu VA only for launch
   - payment disabled unless `IPAYMU_VA` + `IPAYMU_API_KEY` exist
   - no alternate payment gateway deps
2. UI direction:
   - Toraka dark navy + Asura purple accents
3. Sprint 6 hardening:
   - compliance pages live: `/privacy`, `/dmca`, `/contact`, `/terms`
   - GDPR banner live via `src/components/GdprBanner.tsx`
   - normal build verified; no Turbopack build path for launch docs.

---

## 5. Do Not Build Yet

Skip for v2 launch:
- native mobile app
- comments/rating/forum
- UGC upload
- yearly subscription billing
- public profile stats
- offline full download
- admin CMS panel
- Ezoic integration unless AdSense rejected

Add when metric proves need:
- recurring billing after monthly Snap churn/support pain
- recommendation engine after history data enough
- extra payment methods after failed checkout evidence
