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

Ported (5):

| RR7 route | Sumber Next | Status |
|-----------|------------|--------|
| `routes/home.tsx` | `src/app/page.tsx` | ⚠ masih scaffold placeholder |
| `routes/manga.$slug.tsx` | `src/app/manga/[slug]/page.tsx` | ✅ SSR verified (200) |
| `routes/chapter.$chapterId.tsx` | `src/app/chapter/[id]/page.tsx` | ✅ reader verified (200) |
| `routes/api.history.tsx` | `src/app/api/history/route.ts` | ✅ 401 unauthenticated verified |
| `routes/api.subscription.webhook.ts` | `src/app/api/subscription/webhook/route.ts` | ✅ disabled-mode 200 verified |

Belum diport (masih di `src/app/`):

- Pages: `manga` (index), `search`, `bookmark`, `history`, `account`, `contact`, `dmca`, `privacy`, `terms`, `komik/[mangaId]`, `komik/[mangaId]/[chapterId]`, `(auth)/sign-in`, `(auth)/sign-up`
- API: `bookmarks`, `cache/purge`, `health`, `img`, `push/subscribe`, `push/unsubscribe`, `subscription/create`, `subscription/status`, `webhooks/clerk`

## Verifikasi E2E terakhir (2026-07-19)

```
manga SSR              200
chapter reader         200
missing manga          404
history unauth         401
webhook disabled       200
```

Server: `react-router-serve`, DB postgres:16-alpine port 55432.

## Sisa pekerjaan

1. Port homepage asli (ganti scaffold `app/welcome/`)
2. Port page routes sisanya (prioritas: search, bookmark, history, auth pages)
3. Port API routes sisanya (prioritas: webhooks/clerk, push/*)
4. Middleware paritas: CSP headers (dulu di Next middleware) → RR7 `entry.server` / Netlify headers
5. Hapus `src/` + dependensi Next sisa setelah paritas
6. Netlify preview deploy verification
