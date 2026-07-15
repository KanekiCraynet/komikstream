# Software Requirements Specification (SRS)
# KuroManga — Manga Platform Rewrite v2

Version: 1.1
Date: 2026-07-06
Owner: Solo Developer
Status: Sprint 6 complete — build verified
Linked: docs/FRS.md, docs/TECH_SPEC.md, docs/BRD.md

---

## 1. Introduction

### 1.1 Purpose
Dokumen ini mendefinisikan semua software requirements untuk KuroManga v2 —
mencakup functional, non-functional, external interface, dan system requirements.

### 1.2 Scope
Sistem: web application + edge proxy + scheduled jobs.
Domain: kuromanga.me
Pengguna: end consumer Asia (primarily Indonesia)
Deployment: Cloudflare Workers

### 1.3 Definitions

| Term | Meaning |
|------|---------|
| SRS | Software Requirements Specification |
| FRS | Functional Requirements Specification |
| ISR | Incremental Static Regeneration (Next.js) |
| RSC | React Server Component |
| CF | Cloudflare |
| KV | Cloudflare KV (key-value store) |
| VAPID | Voluntary Application Server Identification (Web Push) |
| tier | User access level: "free" atau "premium" |
| grace | 3-hari window setelah failed payment sebelum downgrade |

### 1.4 References

- docs/PRD.md v1.1
- docs/BRD.md v1.0
- docs/TECH_SPEC.md v1.0
- docs/FRS.md v1.0
- Next.js 15 App Router docs
- Prisma 7 docs
- Clerk docs
- iPaymu API docs
- Web Push Protocol (RFC 8030)

---

## 2. Overall Description

### 2.1 System Context

```
[Browser / PWA]
      │
      ▼
[Cloudflare Workers Edge]
  - Rate limiting (KV)
  - Ad frequency cap (KV)
  - Edge cache
  - Image proxy routing
      │
      ▼
[Cloudflare Workers — Next.js 15]
  - App Router (RSC + API routes)
  - Middleware: Clerk auth only (Edge-safe)
  - Prisma 7 ORM
      │
      ▼
[PostgreSQL — Supabase]
      │
  [External APIs]
  - Sansekai API (content)
  - Clerk (auth)
  - iPaymu (payment)
  - web-push (push notifications)
  - AdSense (ads JS)
```

### 2.2 Assumptions

1. Konten manga di-source dari Sansekai API — system tidak menyimpan file media sendiri.
2. User base awal 200–500 concurrent — scale mengikuti konfigurasi Cloudflare Workers.
3. Solo developer — tidak ada review/approval gate antar task.
4. Bahasa UI: Bahasa Indonesia (v2 launch).
5. Browser support: Chrome 90+, Safari 14+, Firefox 88+.

### 2.3 Dependencies

| Dependency | Version | Risk if unavailable |
|-----------|---------|---------------------|
| Next.js | 15.x | HIGH — full rewrite needed |
| Prisma | 7.x | HIGH — ORM migration needed |
| Clerk | latest | MEDIUM — auth fallback to session-only |
| iPaymu | API/env | HIGH — no ID payment |
| web-push | 3.6.x | LOW — push notif optional feature |
| Sansekai API | external | HIGH — no content without it |

---

## 3. System Requirements

### 3.1 Functional Requirements

Semua FR terdokumentasi di docs/FRS.md. Summary per domain:

| Domain | FR Count | Key Requirement |
|--------|----------|----------------|
| Auth | FR-AUTH-01..07 | Clerk + graceful degrade |
| Manga | FR-KOMIK-01..11 | Read, search, filter, redirect |
| Bookmark/History | FR-BM-01..05 | Real-time sync, 500 max history |
| Subscription | FR-SUB-01..08 | iPaymu primary, no card storage |
| Ads | FR-ADS-01..06 | Tier-based DOM removal, Better Ads |
| Push Notif | FR-PUSH-01..04 | VAPID, opt-in only |
| Search | FR-SEARCH-01..04 | Global, < 2s |
| Account | FR-ACC-01..03 | Preferences, delete cascade |
| Admin | FR-ADMIN-01..03 | Internal endpoints, header auth |
| Performance | FR-PERF-01..05 | LCP < 2.5s, ISR, edge cache |
| SEO | FR-SEO-01..04 | Meta, sitemap, robots, 301 |
| Privacy | FR-PRIV-01..04 | Policy page, GDPR banner |

### 3.2 Non-Functional Requirements

#### SR-NFR-01: Performance

| Metric | Requirement |
|--------|-------------|
| LCP | < 2.5s (Asia edge) |
| TTFB | < 400ms (CF cached pages) |
| Chapter image load | < 3s per page (cached) |
| Search response | < 2s |
| API p99 latency | < 1s |
| Build time | < 5 min (CI) |

#### SR-NFR-02: Availability

| Metric | Requirement |
|--------|-------------|
| Uptime | 99.5% monthly |
| DB failover | < 30s via Supabase connection pooler |
| Content fallback | DB cache served if Sansekai API down |
| Graceful 500 | All unhandled errors return JSON error + 500, never crash server |

#### SR-NFR-03: Scalability

| Metric | Requirement |
|--------|-------------|
| Concurrent users | 200–500 v2 launch, scale via Cloudflare Workers |
| DB connections | Max 20 via Supabase pooler (pgbouncer) |
| CF KV reads | < 1,000 req/min per worker (CF limit) |
| Image proxy | Stateless — unlimited scale via CF edge |

#### SR-NFR-04: Security

| Requirement | Implementation |
|-------------|---------------|
| Admin endpoints | x-cron-secret header required |
| Edge proxy | WORKER_TOKEN on all origin requests |
| Payment secrets | Server-only env vars, never in client bundle |
| Auth tokens | Clerk JWT, verified via middleware |
| Image proxy | URL allowlist — reject unknown CDN domains |
| Secrets in git | .gitignore: wp-config*.php, *.docker.log, .env* |

#### SR-NFR-05: Maintainability

| Requirement | Standard |
|-------------|----------|
| TypeScript | strict mode, 0 errors, 0 warnings baseline |
| Test coverage | > 60% (CI threshold) |
| Linting | ESLint 0 warnings on merge |
| Schema drift | prisma migrate diff --exit-code in CI |
| Docs | FRS + SRS + Tech Spec updated per sprint |

#### SR-NFR-06: Accessibility

- Semantic HTML5 (nav, main, article, section) di semua halaman.
- Image alt text required.
- Keyboard navigation di reader (arrow keys).
- Contrast ratio min 4.5:1 (WCAG AA).

---

## 4. External Interface Requirements

### 4.1 User Interfaces

| Interface | Description |
|-----------|-------------|
| Homepage | Latest manga, search bar, genre pills |
| Manga detail | Cover, info, chapter list |
| Chapter reader | Image pages, nav prev/next, reading mode toggle |
| Search results | Manga results |
| Bookmark page | User bookmarks list |
| History page | User reading history |
| Account page | Profile, subscription status, preferences |
| Privacy page | Privacy policy static content |
| DMCA page | DMCA takedown static content |
| Contact page | Contact form/static contact content |
| Terms page | Terms of Service static content |

### 4.2 API Interfaces (internal)

Semua diawali /api/:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /manga | GET | none | List manga |
| /manga/[slug] | GET | none | Manga detail |
| /manga/[slug]/chapters | GET | none | Chapter list |
| /chapter/[id] | GET | none | Chapter images |
| /bookmarks | GET/POST/DELETE | user | Bookmark CRUD |
| /history | GET/POST/DELETE | user | History CRUD |
| /subscription/create | POST | user | Init payment |
| /subscription/status | GET | user | Check tier |
| /subscription/webhook | POST | signature | Payment callback |
| /push/subscribe | POST | user | Register push |
| /push/unsubscribe | POST | user | Remove push |
| /img | GET | none | Image proxy |
| /cache/purge | POST | cron-secret | Purge by type (`komik` or `chapter`) |
| /health | GET | none | DB/app health check |

### 4.3 External API Interfaces

#### Sansekai API
- Base URL: env NEXT_PUBLIC_API_URL
- Auth: env SANSEKAI (token header)
- Rate limit: TBD — implement retry with exponential backoff
- Error handling: serve DB cache on 5xx

#### Clerk
- SDK: @clerk/nextjs
- Middleware integration via src/middleware.ts
- Edge code imports only `src/lib/clerk-flags.ts`
- Graceful degrade: if Clerk env unset, auth skipped

#### iPaymu
- Env: `IPAYMU_VA`, `IPAYMU_API_KEY`, `IPAYMU_URL`, `IPAYMU_SANDBOX`
- Payment enabled only when `IPAYMU_VA` + `IPAYMU_API_KEY` exist
- Webhook: POST `/api/subscription/webhook`

#### Web Push
- Library: web-push npm
- VAPID keys: env `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Push via CF Workers Cron (daily 00:00 UTC)

---

## 5. Data Requirements

### 5.1 Data Models

Full Prisma schema di prisma/schema.prisma. Key models:

| Model | Key Fields | Notes |
|-------|-----------|-------|
| User | id, clerkId, email, tier, preferences | tier default "free" |
| Komik | id, slug, title, genres(JSON), chapters(JSON) | |
| KomikChapter | id, komikId, chapterId, images(JSON) | |
| Bookmark | id, userId, contentId, contentType | contentType: "komik" |
| History | id, userId, contentId, contentType, lastPage | FIFO 500 |
| Subscription | id, userId, tier, status, provider, externalId | NEW |
| PushSubscription | id, userId, endpoint, p256dh, auth | NEW |

### 5.2 Data Retention

| Data | Retention |
|------|-----------|
| User account | Until deleted by user |
| Reading history | 5 years (BRD-F2) |
| Payment records | 7 years (pajak) |
| Push subscriptions | Until unsubscribe |
| Cache (DB) | Per TTL in TECH_SPEC §10 |
| Logs | 90 days |

### 5.3 Data Validation Rules

- User.email: valid email format, unique
- Subscription.status: enum "active"\|"cancelled"\|"expired"\|"grace"
- Subscription.provider: enum "ipaymu"
- User.tier: enum "free"\|"premium"
- User.preferences: Zod schema (UserPreferencesSchema)
- Chapter images: Zod schema (ChapterImagesSchema — url must be string)
- PushSubscription.endpoint: unique constraint

---

## 6. Constraint Requirements

### 6.1 Technology Constraints

- Framework: Next.js 15 App Router (tidak boleh downgrade ke Pages Router)
- ORM: Prisma 7 (WASM edge + native binary dual-target)
- Package manager: pnpm
- Runtime: Node.js 22.x + Cloudflare Workers runtime (edge)
- Language: TypeScript strict

### 6.2 Deployment Constraints

- CF datacenter: auto-routed dari Asia edge
- Container: standalone Next.js output, Docker multi-stage build
- DB: Supabase PostgreSQL, max 20 connections (pooler)
- Secrets: environment variables via Cloudflare Workers

### 6.3 Legal Constraints

- DMCA: konten removal dalam 72 jam setelah valid notice (BRD-L1)
- Data residency: tidak ada persyaratan khusus (pengguna Asia, server Singapore)
- Payment: iPaymu memerlukan credential merchant (VA + API key)
- PPh: final UMKM 0.5% atas omzet subscription (BRD-P5)
- AdSense: Privacy Policy page wajib ada sebelum apply

### 6.4 Budget Constraints

- Solo dev — tidak ada infra baru yang perlu dibayar di atas stack existing
- Dependencies baru: web-push, @types/web-push
- Third-party SaaS baru: tidak ada

---

## 7. Acceptance Criteria

### 7.1 Sprint 0 Gate (before feature development)

- [ ] pnpm run typecheck → exit 0
- [ ] pnpm run test → all tests pass
- [ ] pnpm run lint → 0 warnings
- [ ] pnpm run build → no errors
- [ ] .gitignore covers wp-config*.php + *.docker.log
- [ ] cache-warm.yml valid YAML
- [x] .env.example updated dengan new vars
- [x] VAPID keys listed in .env.example

### 7.2 Launch Gate (before production go-live)

- [x] FR-SUB-01..08 implemented enough for env-gated iPaymu launch
- [x] FR-ADS-01..06 implemented enough for placeholder ads + `ads.txt`
- [x] /privacy page live
- [x] /dmca page live
- [x] /contact page live
- [x] /terms page live
- [ ] iPaymu merchant credentials verified in production env
- [ ] VAPID keys generated + stored in env
- [ ] Prisma migrations run on production DB
- [ ] Cache warming works (200 response)
- [ ] LCP < 2.5s verified di Lighthouse
- [ ] Sitemap + robots.txt accessible
- [ ] 301 redirects verified untuk semua old URLs
- [x] GDPR consent banner live
- [x] `pnpm run lint` → exit 0 (2026-07-06)
- [x] `pnpm exec tsc --noEmit` → exit 0 (2026-07-06)
- [x] `pnpm run build` → exit 0, 24 static pages (2026-07-06)

---

## 8. Traceability Matrix

| Requirement | Source Doc | Sprint | Priority |
|-------------|-----------|--------|----------|
| Auth system | FRS §3 | S1 | P0 |
| Manga reader | FRS §4 | S1 | P0 |
| Bookmark/History | FRS §5 | S1 | P1 |
| Subscription | FRS §6 | S2 | P1 |
| Ads | FRS §7 | S2 | P1 |
| Push notif | FRS §8 | S3 | P2 |
| Search | FRS §9 | S1 | P1 |
| Account mgmt | FRS §10 | S2 | P1 |
| Admin endpoints | FRS §11 | S0 | P0 |
| Performance | FRS §12 | S1 | P0 |
| SEO | FRS §13 | S1 | P1 |
| Privacy/Compliance | FRS §14 | S2 | P1 |
