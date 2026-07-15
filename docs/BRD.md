# Business Requirements Document
# KuroManga — Platform Rewrite

Version: 1.0
Date: 2026-07-05
Owner: Solo Developer
Linked to: docs/PRD.md v1.0
Status: Sprint 6 complete (2026-07-06) — pre-launch stable

---

## 1. Business Context

KuroManga (kuromanga.me) adalah platform baca komik gratis
berbasis scraping, target pasar Asia Tenggara. Model bisnis: ads + subscription.

Bisnis dijalankan solo — tidak ada investor, tidak ada tim legal dedicated.
Semua keputusan business requirement harus realistis untuk solo operator.

---

## 2. Business Objectives

| Objective | KPI | Target | Timeframe |
|-----------|-----|--------|-----------|
| Revenue positif | MRR | > $50 (ads) bulan 1, > $200 (ads+sub) bulan 3 | 90 hari post-launch |
| User retention | DAU/MAU | >= 30% | Bulan ke-3 |
| Subscriber base | Paying users | 50 subscribers bulan 3 | 90 hari post-launch |
| Availability | Uptime | 99.5% (izin downtime ~3.6 jam/bulan) | Ongoing |
| Content freshness | Sync lag | Chapter baru tersedia < 30 menit dari source | Ongoing |

---

## 3. Stakeholders

| Stakeholder | Peran | Kepentingan |
|-------------|-------|-------------|
| Solo Developer | Owner + Operator | Platform berjalan, revenue masuk, ops minimal |
| End User (Free) | Konsumen | Konten gratis, cepat, tidak ganggu |
| End User (Premium) | Subscriber | Ad-free, fitur extra, value for money |
| iPaymu | Payment Gateway | Transaksi legal, settlement lancar |
| Google AdSense / Ezoic | Ad Network | Traffic real, konten tidak melanggar ToS |
| Clerk | Auth Provider | MAU dalam free tier atau berbayar sesuai |
| Cloudflare | Infra | Bandwidth usage dalam batas plan |


---

## 4. Business Rules

### 4.1 Content

BR-C1: Platform hanya menampilkan konten yang tersedia di source publik.
        Tidak menyimpan file komik di storage sendiri.

BR-C2: Konten dewasa (18+) tidak ditampilkan tanpa age gate.
        Default: semua konten dianggap general audience kecuali source
        menandai explicit.

BR-C3: DMCA takedown request harus dapat diproses dalam 72 jam.
        Wajib ada contact page + abuse@kuromanga.me alias.

BR-C4: Tidak ada user-generated upload. Platform adalah read-only aggregator.

### 4.2 Monetisasi — Ads

BR-A1: Ads tidak boleh ditampilkan di halaman sign-in, sign-up, dan
        halaman akun/profil.

BR-A2: Ads tidak ditampilkan untuk user dengan tier Premium aktif.
        Check dilakukan server-side, bukan hanya client-side.

BR-A3: Interstitial ad wajib skippable setelah 5 detik.
        Tidak boleh block navigasi lebih dari 5 detik.

BR-A4: Tidak boleh memasang ad yang autoplay audio tanpa user gesture.
        Melanggar AdSense Better Ads Standards → risiko suspend.

BR-A5: Ad placement mengikuti Google Better Ads Standards:
        - Tidak lebih dari 30% viewport ads saat load
        - Tidak ada pop-under
        - Tidak ada sticky ads yang cover > 30% layar mobile

BR-A6: Click fraud prevention: jika CTR > 10% abnormal dalam 24 jam,
        auto-flag ke admin dashboard dan sementara matikan slot tersebut.

### 4.3 Monetisasi — Subscription

BR-S1: Harga dalam IDR untuk user Indonesia, USD untuk non-Indonesia.
        IDR 29.000/bulan, IDR 249.000/tahun (= 2 bulan gratis).
        USD 2.99/bulan, USD 24.99/tahun.

BR-S2: Pembayaran gagal (failed payment) tidak langsung revoke akses.
        Grace period: 3 hari. Setelah 3 hari tanpa pembayaran sukses,
        downgrade ke Free tier.

BR-S3: Pembatalan subscription: user tetap Premium sampai akhir periode
        yang sudah dibayar. Tidak ada refund pro-rata.

BR-S4: Refund hanya untuk kasus double-charge atau technical error yang
        dapat diverifikasi dari iPaymu dashboard.
        Refund manual via gateway, bukan automated.

BR-S5: User di-ban (misal: abuse) → subscription dicancel tanpa refund.
        Keputusan ban adalah diskresi operator.

BR-S6: Trial gratis: tidak ada free trial untuk menghindari payment method
        harvesting. Free tier permanen sudah cukup sebagai trial.

BR-S7: Subscription data harus disimpan minimal 5 tahun untuk keperluan
        pajak/audit (wajib per regulasi Indonesia UMKM digital).

### 4.4 User Data & Privacy

BR-P1: Data yang dikumpulkan dari user:
        - Email + nama (dari Clerk, OAuth/email)
        - Reading history (komik yang dibaca)
        - Bookmark list
        - Payment method token (disimpan di iPaymu, TIDAK di DB sendiri)
        - Push notification subscription endpoint
        - IP address (logs, tidak disimpan di DB user)

BR-P2: Platform wajib punya Privacy Policy page sebelum launch.
        Minimum cover: data yang dikumpulkan, retensi data, hak hapus akun.

BR-P3: User bisa request hapus akun. Hapus: data Clerk + semua DB records
        milik user tersebut. History anonim boleh dipertahankan agregat.

BR-P4: Tidak ada jual data user ke pihak ketiga.

BR-P5: Cookie consent banner wajib untuk user dari EU/UK (GDPR).
        Untuk user Asia Tenggara: informational banner cukup (belum ada
        regulasi setara GDPR di ID/MY/PH/TH yang berlaku untuk bisnis kecil).

BR-P6: Logging: access logs Cloudflare disimpan max 7 hari.

### 4.5 Auth & Access Control

BR-U1: Konten baca (chapter) dapat diakses TANPA login.

BR-U2: Bookmark dan history sync WAJIB login.

BR-U3: Subscription WAJIB login. Tidak ada anonymous payment.

BR-U4: Admin internal endpoints (dashboard, cache-purge, migrate, seed)
        WAJIB dilindungi CRON_SECRET atau session admin.
        Tidak boleh accessible secara publik.

BR-U5: Rate limiting wajib pada semua API endpoints:
        - Search: 30 req/menit per IP
        - Bookmark/history write: 60 req/menit per user
        - Subscription create: 5 req/jam per user

### 4.6 Availability & SLA

BR-SLA1: Downtime planned (maintenance): maksimal 2 jam/bulan.
          Wajib ada maintenance page (503 with Retry-After header).

BR-SLA2: Downtime unplanned target: < 1.6 jam/bulan (99.5% uptime).

BR-SLA3: Source API down: platform tetap serve konten dari DB cache.
          Chapter reader tidak boleh blank jika images sudah pernah
          di-cache sebelumnya.

BR-SLA4: Health check endpoint (/api/health) wajib return 200 dalam 3s.

---

## 5. Compliance Requirements

### 5.1 Payment Compliance

- iPaymu: wajib verifikasi merchant account (VA + API key)
- iPaymu: tidak menyimpan raw card number di server — gunakan iPaymu VA
- PCI DSS: tidak applicable jika tidak menyimpan card data sendiri (delegasi ke gateway)

### 5.2 Pajak

- Pendapatan dari subscription dan ads wajib dilaporkan sebagai penghasilan pribadi
  (jika belum berbadan hukum) atau PKP (jika sudah PT/CV)
- Google AdSense: tax form W-8BEN wajib diisi untuk pembayaran luar negeri
- iPaymu settlement: masuk rekening IDR, kena pajak PPh final UMKM 0.5%
  jika omzet < 4.8M/tahun, atau tarif normal jika lebih

### 5.3 Hosting Compliance


- Cloudflare ToS: konten yang di-scrape dari source publik masih dalam gray area
  yang diterima

---

## 6. Business Constraints

BC-1: Budget infra maksimal $100/bulan di awal (break-even dari ads sebelum
       naikkan tier infra)

BC-2: Solo developer — tidak ada dedicated support staff. Response time
       untuk user complaint: best effort, target < 48 jam.

BC-3: Tidak ada entitas hukum formal di awal (personal/freelance).
       Jika MRR > IDR 5.000.000/bulan, pertimbangkan buat CV/PT.

BC-4: Tidak menambah managed service baru jika fungsi bisa dicover oleh
       CF Workers + Supabase yang sudah ada.

BC-5: Semua third-party SDK harus audit dependency sebelum pasang.
       Tidak ada SDK yang inject arbitrary script ke halaman reader.

---

## 7. Success Criteria (Launch Gate)

Platform boleh launch jika semua item berikut terpenuhi:

[ ] Privacy Policy page live
[ ] AdSense account approved
[ ] iPaymu merchant account verified
[ ] BR-A1 s/d BR-A5 implemented dan ditest
[ ] BR-S1 s/d BR-S4 implemented (payment flow end-to-end)
[ ] BR-U4 verified (admin endpoints tidak publik)
[ ] Rate limiting aktif di semua endpoints yang disebut BR-U5
[ ] Health check passing
[ ] Uptime monitor aktif (UptimeRobot free tier cukup)
[ ] Contact/abuse page live
[ ] DMCA process documented (minimal text di footer)

---

## 8. Out of Scope (Business)

- Kontrak dengan publisher komik (tidak ada licensing)
- Tim customer support
- SLA tertulis untuk user (tidak ada service agreement)
- Multi-currency billing selain IDR
- Pembayaran via e-wallet lokal (GoPay, OVO) — masuk Sprint+ via iPaymu
