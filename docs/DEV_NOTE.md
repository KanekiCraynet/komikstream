# Development Note
# KuroManga — Manga Platform Rewrite v2

Version: 1.0
Date: 2026-07-07
Owner: Solo Developer
Status: Sprint 6 complete (2026-07-07) — build verified, 24 static pages, 29 routes

---

## 1. Scope

Project ini manga-only. Tidak ada non-manga media playback scope.

Target utama:
- Baca manga/chapter cepat.
- Bookmark + reading history sync.
- Subscription + ads.
- Push notification chapter baru.
- SEO manga kuat.
- Operasional ringan untuk solo developer.

---

## 2. Stack Tetap

Gunakan stack existing dari dokumen project. Jangan tambah infra baru.

| Area | Tech |
|------|------|
| App | Next.js 15 App Router |
| Language | TypeScript strict |
| ORM | Prisma 7 |
| DB | Supabase PostgreSQL |
| Auth | Clerk |
| Edge | Cloudflare Workers + KV + Cache API |
| Origin | Azure Container Apps |
| Payment | iPaymu (ID, env-gated). No fallback gateway at launch |
| Push | Web Push API + VAPID |
| Ads | Google AdSense |
| Package manager | pnpm |
| Runtime | Node.js 22.x |

Rule: kalau fitur bisa jalan dengan stack di atas, jangan tambah service/dependency.

---

## 3. Development Rules

1. Manga-only routes:
   - /manga
   - /manga/[slug]
   - /chapter/[id]
   - /search
   - /bookmark
   - /history
   - /account
   - /privacy
   - /dmca
   - /contact
   - /terms
   - /api/bookmarks
   - /api/history
   - /api/img
   - /api/cache/purge
   - /api/health
   - /api/push/subscribe
   - /api/push/unsubscribe
   - /api/webhooks/clerk

2. Tidak boleh tambah route non-manga media playback.

3. Cache purge hanya menerima type:
   - komik
   - chapter

4. Bookmark/history contentType hanya:
   - komik

5. Push notification hanya untuk chapter baru pada manga yang di-bookmark.

6. Ads rules:
   - `public/ads.txt` placeholder until real AdSense publisher ID exists.
   - Free/guest reader: `BannerAd` every 5 chapter pages.
   - Free/guest reader: `InterstitialAd` on last page, close after 5 seconds.
   - Premium reader: zero ad DOM; tier must come from server DB via `getUserTier()`.
   - No ads on auth/account pages.

7. Edge/runtime rules:
   - Edge paths import `clerkEnabled` only from `src/lib/clerk-flags.ts`.
   - API routes that import Prisma/Node libs use `export const runtime = 'nodejs'`.

---

## 4. Production Rules

- Cloudflare handle rate limit, ad cap, image proxy, cache.
- Azure Container Apps handle Next.js origin.
- Supabase PostgreSQL tetap source of truth untuk user, subscription, bookmark, history, push subscription.
- Sansekai API hanya content source; DB cache dipakai saat source down.
- Jangan simpan file manga di storage sendiri.
- Jangan tambah background worker baru kalau CF Cron cukup.

---

## 5. Verification Before Ship

Run sebelum deploy:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```

Doc check:

```bash
grep -RniE 'non-manga media playback|mixed media product scope' docs/
```

Expected: only DEV_NOTE guardrail references.

---

## 6. Launch Hardening (2026-07-07)

Patches applied before launch verification:

1. **Build command** — `package.json` `"build"` changed to normal `next build` (no Turbopack for production).
2. **next.config.ts** — pin project root via `outputFileTracingRoot` + `turbopack.root`.
3. **Stray lockfile** — deleted `/home/zee/package-lock.json` (Next tracked wrong workspace root).
4. **Middleware** — Clerk handler + global CSP headers (`default-src 'self'`, `img-src https: data: blob:`, `frame-src 'none'`).
5. **Cache purge** — `timingSafeEqual` length guard prevents crash on mismatched token length.
6. **`.env.example`** — `CLERK_WEBHOOK_SIGNING_SECRET` (was `CLERK_WEBHOOK_SECRET`), `CRON_SECRET`, `VAPID_SUBJECT`.

Build pass: `pnpm run lint && pnpm run typecheck && pnpm run build` exit 0, 32s, 29 routes, 24 static pages, middleware 89.7 kB.
