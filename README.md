# KuroManga v2

Manga platform rewrite — solo project. Reader, bookmark, subscription, push notification.

> **Branch `migration/react-router-v7`** — stack sedang dimigrasi dari Next.js 15 ke React Router 7.
> Status port: lihat [`docs/MIGRATION_RR7.md`](docs/MIGRATION_RR7.md).

**Stack (branch ini)**: React Router 7 (framework mode, SSR) · Vite 8 · TypeScript strict · Prisma 7 · PostgreSQL · Clerk (`@clerk/react-router`) · iPaymu · Tailwind 4 · Netlify

**Stack (main, legacy)**: Next.js 15 App Router — masih hidup di `src/` sampai semua route diport.

## Quick Start

```bash
pnpm install
docker run -d --name komikstream-pg -e POSTGRES_PASSWORD=postgres \
  -p 55432:5432 postgres:16-alpine   # local DB
pnpm run db:push && pnpm run dev     # http://localhost:5173
```

Production run (react-router-serve tidak membaca `.env` — pass inline):

```bash
pnpm run build
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/komikstream' pnpm run start
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Vite dev server (RR7 framework mode) |
| `pnpm run build` | `prisma generate` + `react-router build` |
| `pnpm run start` | `react-router-serve ./build/server/index.js` |
| `pnpm run test` | Vitest (unit: manga.server, ipaymu.server) |
| `pnpm run typecheck` | `react-router typegen && tsc` |
| `pnpm run db:generate` | Prisma client generate → `app/generated/prisma` (gitignored) |
| `pnpm run db:migrate` | Prisma migrate dev |
| `pnpm run db:push` | Prisma db push |

## Env

Copy `.env.example` → `.env`. Required groups:

- `DATABASE_URL` — PostgreSQL
- `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` (RR7: tanpa prefix `NEXT_PUBLIC_`)
- `CLERK_WEBHOOK_SIGNING_SECRET` — Clerk webhook (svix-verified)
- `IPAYMU_VA`, `IPAYMU_API_KEY`, `IPAYMU_URL`, `IPAYMU_SANDBOX`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## Layout

```
app/                  # React Router 7 app (aktif)
  routes.ts           # route manifest
  routes/             # route modules (loader/action per file)
  lib/                # *.server.ts = server-only (db, auth, manga, ipaymu)
  components/
src/                  # LEGACY Next.js app — dibaca saja, jangan tambah fitur
docs/                 # requirement & spec docs
prisma/               # schema + seed
```

## Deploy

Netlify via `@netlify/vite-plugin-react-router` (`netlify.toml`: build `pnpm run build`, publish `build/client`). Push branch → preview deploy.

## Docs

- `docs/MIGRATION_RR7.md` — **status migrasi Next → RR7** (baca ini dulu)
- `docs/SRS.md` / `docs/PRD.md` / `docs/BRD.md` / `docs/FRS.md` — requirements
- `docs/TECH_SPEC.md` — technical spec (legacy Next; RR7 delta di MIGRATION_RR7)
- `docs/MAINTENANCE.md` — ops notes
- `docs/DEV_NOTE.md`, `docs/DEV_IMPLEMENTATION_PLAN.md` — dev history
- `docs/UI_UX_ASURASCANS.md`, `docs/UI_UX_TORAKA.md` — UI references
