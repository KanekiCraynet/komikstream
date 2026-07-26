# Migrasi Next.js 15 → React Router 7

Branch: `migration/react-router-v7` · Strategi: **incremental vertical slice** — `src/` (Next) tetap tracked sebagai referensi, `app/` (RR7) jadi target. Route diport satu per satu; `src/` dihapus setelah paritas penuh.

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

Ported (12):

| RR7 route | Sumber Next | Status |
|-----------|------------|--------|
| `routes/home.tsx` | `src/app/page.tsx` | ✅ ported, hero asli |
| `routes/manga._index.tsx` | `src/app/manga/page.tsx` | ✅ grid + cover, E2E 200 |
| `routes/manga.$slug.tsx` | `src/app/manga/[slug]/page.tsx` | ✅ SSR verified (200) |
| `routes/chapter.$chapterId.tsx` | `src/app/chapter/[id]/page.tsx` | ✅ reader verified (200) |
| `routes/search.tsx` | `src/app/search/page.tsx` | ✅ loader + query, E2E 200 |
| `routes/bookmark.tsx` | `src/app/bookmark/page.tsx` | ✅ client-state → loader/action+Form |
| `routes/history.tsx` | `src/app/history/page.tsx` | ✅ client-state → loader/action+Form |
| `routes/contact.tsx` | `src/app/contact/page.tsx` | ✅ static |
| `routes/dmca.tsx` | `src/app/dmca/page.tsx` | ✅ static |
| `routes/privacy.tsx` | `src/app/privacy/page.tsx` | ✅ static |
| `routes/terms.tsx` | `src/app/terms/page.tsx` | ✅ static |
| `routes/api.history.tsx` | `src/app/api/history/route.ts` | ✅ 401 unauthenticated verified |
| `routes/api.subscription.webhook.ts` | `src/app/api/subscription/webhook/route.ts` | ✅ disabled-mode 200 verified |

Belum diport (sumber di git history, `git show 7801f84^:src/app/...`):

- Pages: `account`, `komik/[mangaId]`, `komik/[mangaId]/[chapterId]`, `(auth)/sign-in`, `(auth)/sign-up`
- API: `bookmarks`, `cache/purge`, `health`, `img`, `push/subscribe`, `push/unsubscribe`, `subscription/create`, `subscription/status`, `webhooks/clerk`

## Verifikasi E2E terakhir (2026-07-26)

```
/  /manga  /search  /search?q=one  /manga/one-piece  /chapter/op-1   200
/bookmark  /history  /contact  /dmca  /privacy  /terms              200
/manga/nonexistent                                                  404
POST /api/history unauth                                            401
```

Server: `react-router-serve` port 43700, DB postgres:16-alpine port 55432,
seed via `node --experimental-strip-types prisma/seed.ts` (butuh `DATABASE_URL` di env).
Typecheck clean, vitest 4/4, build OK.

## Sisa pekerjaan

1. Port `account` page + auth pages (sign-in/sign-up, perlu Clerk components RR7)
2. Port API routes sisanya (prioritas: webhooks/clerk, push/*, subscription/*)
3. Redirect legacy `komik/[mangaId]` → `manga/:slug` atau port
4. Middleware paritas: CSP headers (dulu di Next middleware) → RR7 `entry.server` / Netlify headers
5. Netlify preview deploy verification
