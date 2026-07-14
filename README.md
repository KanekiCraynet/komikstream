# KuroManga v2

Manga platform rewrite — solo project. Reader, bookmark, subscription, push notification.

**Stack**: Next.js 15 App Router · TypeScript strict · Prisma 7 · PostgreSQL (Supabase) · Clerk · iPaymu · Cloudflare Workers · Azure Container Apps

## Quick Start

```bash
pnpm install
pnpm run dev        # http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Dev server with Turbopack |
| `pnpm run build` | Production build (normal, no Turbopack) |
| `pnpm run start` | Production server |
| `pnpm run lint` | ESLint |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run db:generate` | Prisma client generate |
| `pnpm run db:migrate` | Prisma migrate dev |
| `pnpm run db:push` | Prisma db push |

## Env

Copy `.env.example` → `.env`. Required groups:

- `DATABASE_URL` — PostgreSQL (Supabase)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET` — Clerk webhook (svix-verified)
- `CRON_SECRET` — cache purge endpoint auth
- `IPAYMU_VA`, `IPAYMU_API_KEY`, `IPAYMU_URL`, `IPAYMU_SANDBOX`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## Key Fixes (2026-07-07)

- Build: switched from Turbopack to normal `next build` — stable, 32s compile, 29 routes, 24 static pages
- `next.config.ts`: added `outputFileTracingRoot` + `turbopack.root` to fix stray lockfile root confusion
- Stray `/home/zee/package-lock.json` deleted (Next traced wrong workspace root)
- Middleware: Clerk auth handler + global CSP headers (`default-src 'self'`, `img-src https: data: blob:`)
- Cache purge endpoint: `timingSafeEqual` length guard added (prevents crash on mismatched buffer length)
- `.env.example`: `CLERK_WEBHOOK_SECRET` → `CLERK_WEBHOOK_SIGNING_SECRET`; `VAPID_SUBJECT` confirmed

## Known Limitations

- Local PostgreSQL needed for DB routes — `/api/health` returns 503 without it
- `metadataBase` fallback `http://localhost:3000` — set production domain in prod
- `remotePatterns` not in `next.config.ts` — remote komik images may need re-add if broken
- `CRON_SECRET` not in `.env` by default — required for cache purge

## Docs

- `docs/SRS.md` — Software Requirements
- `docs/PRD.md` — Product Requirements
- `docs/BRD.md` — Business Requirements
- `docs/FRS.md` — Functional Requirements
- `docs/TECH_SPEC.md` — Technical Specification
- `docs/DEV_NOTE.md` — Developer notes & guardrails
- `docs/MAINTENANCE.md` — Maintenance guide
- `docs/DEV_IMPLEMENTATION_PLAN.md` — Sprint plan & delivery

## License

Private — KuroManga
