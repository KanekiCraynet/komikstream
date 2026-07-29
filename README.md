# KomikStream

Platform baca manga: katalog, reader multi-mode, bookmark, riwayat baca,
langganan premium (bebas iklan), dan web push notification.

> Migrasi **Next.js 15 → React Router 7 selesai**. Semua route sudah diport;
> `src/` (Next.js legacy) sudah dihapus dari git. Detail: [`docs/MIGRATION_RR7.md`](docs/MIGRATION_RR7.md).
>
> Catatan nama: UI memakai **KomikStream**; paket `komikstream-rr7`; dokumen
> requirement lama (SRS/PRD/dll) memakai nama proyek awal **KuroManga**.

**Stack**: React Router 7 (framework mode, SSR) · Vite 8 · TypeScript strict ·
Prisma 7 · PostgreSQL · Clerk (`@clerk/react-router`) · iPaymu · Web Push ·
Tailwind 4 · Netlify

Arsitektur lengkap + penjelasan tiap modul: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Quick Start

```bash
pnpm install
docker run -d --name komikstream-pg -e POSTGRES_PASSWORD=postgres \
  -p 55432:5432 postgres:16-alpine   # DB lokal
pnpm run db:push && pnpm run dev     # http://localhost:5173
```

Production run (react-router-serve tidak membaca `.env` — pass inline):

```bash
pnpm run build
DATABASE_URL='postgresql://postgres:***@127.0.0.1:55432/komikstream' pnpm run start
```

## Scripts

| Command | Deskripsi |
|---------|-----------|
| `pnpm run dev` | Vite dev server (RR7 framework mode) |
| `pnpm run build` | `prisma generate` + `react-router build` |
| `pnpm run start` | `react-router-serve ./build/server/index.js` |
| `pnpm run test` | Vitest (CSRF, Sanka image parsing, iPaymu signature) |
| `pnpm run typecheck` | `react-router typegen && tsc` |
| `pnpm run db:generate` | Prisma client generate → `app/generated/prisma` (gitignored) |
| `pnpm run db:migrate` | Prisma migrate dev |
| `pnpm run db:push` | Prisma db push |

## Env

Copy `.env.example` → `.env`. Grup wajib/opsional:

- `DATABASE_URL` — PostgreSQL (wajib)
- `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` + `CLERK_WEBHOOK_SIGNING_SECRET` — auth (kosong = guest-only)
- `IPAYMU_VA`, `IPAYMU_API_KEY`, `IPAYMU_URL`, `IPAYMU_SANDBOX` — pembayaran (kosong = langganan disabled)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — web push (kosong = push disabled)
- `APP_URL` — dipakai iPaymu return/notify URL (default `http://localhost:3000`)

Semua fitur berbayar/auth **fail-safe**: env kosong = fitur mati sopan, bukan crash.

## Layout

```
app/                  # React Router 7 app (satu-satunya app aktif)
  root.tsx            # root layout + ClerkProvider + ErrorBoundary
  routes.ts           # route manifest (config-based)
  routes/             # modul route (loader/action/UI per file)
  lib/                # *.server.ts = server-only (db, auth, ipaymu, push, subscription)
  components/         # MangaCard, MangaReader, UI components
prisma/               # schema + seed + migrations
public/               # sw.js (push), ads.txt
docs/                 # dokumentasi
```

## Deploy

Netlify via `@netlify/vite-plugin-react-router` (`netlify.toml`: build
`pnpm run build`, publish `build/client`). Push branch → preview deploy.

## Docs

Indeks lengkap: [`docs/README.md`](docs/README.md).

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — **arsitektur + penjelasan tiap modul** (baca ini dulu)
- [`docs/MIGRATION_RR7.md`](docs/MIGRATION_RR7.md) — riwayat & status migrasi Next → RR7
- `docs/SRS.md` · `docs/PRD.md` · `docs/BRD.md` · `docs/FRS.md` — requirements (era KuroManga/Next)
- `docs/TECH_SPEC.md` — technical spec lama (era Next; delta RR7 di ARCHITECTURE)
- `docs/MAINTENANCE.md` — catatan ops
- `docs/DEV_NOTE.md`, `docs/DEV_IMPLEMENTATION_PLAN.md` — dev history
- `docs/UI_UX_ASURASCANS.md` — referensi UI
