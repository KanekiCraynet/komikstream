# Product Requirements Document
# KuroManga — Manga Platform Rewrite v2

Version: 1.1
Date: 2026-07-06
Owner: Solo Developer
Status: Sprint 6 complete — build verified

---

## 1. Problem Statement

kuromanga.me berjalan di atas komikstream — codebase yang sehat secara teknis
(0 TS errors, 167 tests pass, CI solid) tetapi dibangun secara incremental tanpa
foundation dokumen produk. Akibatnya:

- Fitur monetisasi (subscription, ads) belum ada sama sekali
- User flow untuk Asia belum dioptimasi (bahasa, UX pattern)
- Arsitektur cache dan scraping tidak terdokumentasi → sulit di-extend
- Tidak ada metric success yang terdefinisi

Rewrite ini bukan ganti stack — stack sudah tepat. Tujuannya adalah rebuild
sebagai platform baca manga dengan product intent yang jelas sejak hari pertama.

---

## 2. Goals

| Goal | Metric Success |
|------|---------------|
| Monetisasi aktif berjalan | MRR > 0 dalam 60 hari post-launch |
| Retensi user Asia | DAU/MAU ratio >= 30% bulan ke-3 |
| Performa edge | LCP < 2.5s di Asia (Lighthouse >= 85) |
| Solo operasional | Zero unplanned downtime tanpa on-call team |
| Scale awal | Handle 500 CCU tanpa infra change |

Non-Goals:
- Mobile native app (tidak di scope ini)
- User-generated content / upload komik
- Multi-language lain selain ID + EN

---

## 3. Target Users

Primary: Asia Tenggara — Indonesia, Malaysia, Filipina, Thailand
Secondary: diaspora Asia global

Persona A — Casual Reader (80% traffic)
- Baca komik gratis via ads
- Mobile-first, koneksi 4G/LTE
- Tidak mau register, langsung baca

Persona B — Power Reader (15% traffic)
- Baca 10+ chapter/hari
- Mau bayar untuk ad-free + early chapter + history sync cross-device
- Sudah punya akun

---

## 4. Feature Scope

### 4.1 Core (ada di komikstream, pertahankan + polish)

- Komik reader: chapter navigation, image lazy-load, keyboard shortcuts
- Search: komik unified
- Bookmark + reading history (auth-gated)
- Sitemap + SEO structured data
- Auth via Clerk (sign-in/sign-up)

### 4.2 New — Monetisasi

#### Ads (launch hari 1)

- Display ads: banner di antara chapter pages (setiap 5 halaman)
- Interstitial: saat pindah chapter (1x per session, skippable 5s)
- Provider: Google AdSense atau Ezoic (tergantung traffic threshold)
- Ads dimatikan otomatis untuk subscriber
- Metric: RPM target > $2 untuk traffic Asia

#### Subscription (launch minggu 2-4)

Tier Free:
- Baca semua konten + ads
- History + bookmark sync (cloud)
- Limit: 3 device

Tier Premium (IDR 29.000/bulan atau IDR 249.000/tahun):
- Ad-free
- Reading mode unlocked (webtoon + page-flip)
- Cross-device sync unlimited
- Early chapter access (jika tersedia dari source)
- Badge profil

Payment stack:
- iPaymu (ID market)
- No fallback gateway for launch
- Webhook → update user tier di DB

### 4.3 New — User Experience

- Onboarding flow: genre preference saat sign-up pertama
- Continue reading widget di homepage (last 3 items dari history)
- Dark/light mode toggle (persistent via cookie)
- Reading direction: LTR / RTL / webtoon scroll
- Offline reading: cache chapter images via Service Worker (Premium only)
- Push notification: chapter baru untuk manga yang di-bookmark (PWA)

### 4.4 New — Admin / Ops

- Health endpoint: `/api/health` with DB check
- Manual cache purge endpoint: `/api/cache/purge` gated by `x-cron-secret`
- Image proxy: `/api/img?url=` with CDN allowlist
- Internal dashboard deferred for launch (solo dev/YAGNI)

---

## 5. User Stories (MoSCoW)

### Must Have

- Sebagai casual reader, saya bisa baca chapter tanpa register
- Sebagai casual reader, saya melihat ads yang tidak merusak reading experience
- Sebagai power reader, saya bisa subscribe dan hilangkan semua ads
- Sebagai power reader, history dan bookmark saya sync di semua device
- Sebagai user mobile, halaman load < 3s di koneksi 4G
- Sebagai user, saya bisa search komik dari satu search bar
- Sebagai subscriber, payment saya diproses aman via iPaymu

### Should Have

- Sebagai user, saya dapat rekomendasi berdasarkan genre yang saya baca
- Sebagai reader, saya dapat notifikasi chapter baru untuk manga yang di-bookmark
- Sebagai user, saya bisa pilih reading direction (webtoon/page)
- Sebagai admin, saya bisa lihat revenue dan subscriber count hari ini

### Could Have

- Sebagai subscriber Premium, saya bisa baca offline
- Sebagai user, saya punya profil publik dengan reading stats
- Sebagai user, saya bisa rate dan komentar chapter

### Won't Have (this version)

- Upload komik oleh user
- Forum / komunitas
- Mobile app native
- Multi-language UI (selain ID)

---

## 6. Technical Constraints

Stack dipertahankan dari komikstream:
- Next.js 15 App Router + TypeScript
- Prisma 7 + PostgreSQL (Supabase)
- Clerk auth
- CF Workers edge runtime
- pnpm + Turborepo-compatible structure

Tambahan untuk rewrite:
- iPaymu integration untuk payment
- Web Push API untuk notifikasi (service worker)
- KV (Cloudflare) untuk session-level ad-frequency capping
- Zod validation wajib untuk semua JSON DB columns

Constraints operasional (solo dev):
- Zero managed infra baru jika bisa pakai Cloudflare existing
- Semua cron/background job via CF Workers Cron Triggers
- Monitoring: CF Analytics

---

## 7. Data Model Changes (delta dari komikstream)

### New: Subscription

```
model Subscription {
  id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  userId      String   @unique
  tier        String   // "free" | "premium"
  status      String   // "active" | "cancelled" | "expired"
  provider    String   // "ipaymu"
  externalId  String?  // provider transaction ID
  startedAt   DateTime
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  User        User     @relation(...)
}
```

### New: Notification

```
model PushSubscription {
  id        String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
}
```

### Update: User

Tambah field:
- tier String @default("free")
- preferences Json? (genre list, reading direction, theme)
- lastSeenAt DateTime?

---

## 8. API Surface (new endpoints)

```
POST /api/subscription/create     — initiate iPaymu payment
POST /api/subscription/webhook    — iPaymu webhook handler
GET  /api/subscription/status     — current user tier
POST /api/push/subscribe          — save push subscription
POST /api/push/unsubscribe        — remove push subscription
GET  /api/health                  — app + DB health check
GET  /api/img?url=                — image proxy with host allowlist
POST /api/cache/purge             — manual cache purge, x-cron-secret gated
```

---

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AdSense rejection (traffic threshold) | Medium | High | Pakai Ezoic sebagai fallback, setup dari hari 1 |
| iPaymu integration delay | Low | Medium | Keep payment disabled unless `IPAYMU_VA` + `IPAYMU_API_KEY` exist |
| Scraping source down | High | High | Multi-source fallback + DB cache TTL strategy |
| Solo bandwidth bottleneck | High | Medium | Prioritas ketat, P2 fitur defer post-launch |
| CF Workers CPU limit (free tier) | Medium | Medium | Monitor workers analytics, upgrade jika perlu |

---

## 10. Timeline (estimasi solo dev)

Sprint 0 — Foundation (1 minggu)
- Fix P0 audit items (cache-warm, .gitignore, lint warnings)
- Setup docs/ structure (PRD, BRD, Tech Spec)
- DB schema migration: Subscription, PushSubscription, User update
- Zod schemas untuk semua JSON columns

Sprint 1 — Core Rewrite Polish (2 minggu)
- Reader polish: webtoon mode, LTR/RTL toggle, keyboard nav
- Dark/light mode persistent
- Continue reading widget homepage
- Onboarding genre preference

Sprint 2 — Monetisasi Ads (1 minggu)
- AdSense integration + placement strategy
- Ad frequency cap via CF KV
- Ad-free flag check pada render

Sprint 3 — Ads (1 minggu)
- AdSense integration + ads.txt
- Banner + interstitial components
- Premium ad-free gating
- Better Ads standards enforcement

Sprint 4 — Subscription (1 minggu)
- iPaymu payment flow
- Webhook handler + tier update
- Premium badge + UI gating
- Subscription management page

Sprint 5 — Push + PWA (1 minggu)
- Service Worker setup
- Web Push subscribe/unsubscribe
- Cron trigger: kirim notif chapter baru

Sprint 6 — Hardening + Launch (1 minggu)
- Compliance pages: privacy, DMCA, contact, terms
- GDPR/localStorage consent banner
- Middleware hardening: Clerk only, image proxy in `/api/img`
- Build/lint/typecheck launch gate

All planned sprints complete as of 2026-07-06. Launch blockers now external/env: DB availability, VAPID keys, payment credentials, production deploy.
