# Functional Requirements Specification (FRS)
# KuroManga — Manga Platform Rewrite v2

Version: 1.0
Date: 2026-07-05
Owner: Solo Developer
Status: Sprint 6 complete (2026-07-06) — pre-launch stable
Linked: docs/PRD.md, docs/BRD.md, docs/TECH_SPEC.md

---

## 1. Scope

Dokumen ini mendefinisikan semua functional requirements untuk KuroManga v2 —
platform baca manga berbasis web dengan monetisasi subscription + ads,
target pengguna Asia, solo developer.

Cakupan: semua fitur yang HARUS ada (MUST), SEBAIKNYA ada (SHOULD), dan BOLEH ada (MAY)
sebelum launch production.

---

## 2. User Roles

| Role | Description |
|------|-------------|
| Guest | Belum login, bisa baca konten terbatas |
| Free User | Login, akses penuh tapi dengan ads |
| Premium User | Login + aktif subscription, tanpa ads + fitur ekstra |
| Admin | Internal — akses dashboard + cache management |

---

## 3. Authentication & Authorization

### FR-AUTH-01
Guest DAPAT membaca halaman manga/komik tanpa login.

### FR-AUTH-02
Guest DAPAT membaca chapter tanpa login.

### FR-AUTH-03
Guest TIDAK DAPAT menyimpan bookmark atau history.
System HARUS menampilkan prompt login saat Guest mencoba bookmark/history.

### FR-AUTH-04
User HARUS login via Clerk (email/Google/GitHub OAuth).

### FR-AUTH-05
System HARUS mengizinkan login tanpa password (magic link / OAuth).

### FR-AUTH-06
Protected routes: /bookmark, /history, /account, /api/bookmarks, /api/history.
System HARUS redirect ke halaman login jika user belum auth.

### FR-AUTH-07
System HARUS gracefully degrade jika Clerk tidak dikonfigurasi (dev/CI).
Tidak ada crash — hanya fitur auth yang nonaktif.

---

## 4. Manga / Komik

### FR-KOMIK-01
System HARUS menampilkan daftar manga terbaru di halaman utama.
Default sort: terbaru diupdate. Limit: 20 per page.

### FR-KOMIK-02
System HARUS menampilkan halaman detail manga dengan:
- Cover image
- Judul, alternatif title, genre, status (ongoing/completed)
- Synopsis
- Daftar chapter (descending by number)
- Tombol bookmark

### FR-KOMIK-03
System HARUS mendukung pembacaan chapter manga secara berurutan (page-by-page).

### FR-KOMIK-04
System HARUS mendukung navigasi antar chapter (prev/next) dari reader.

### FR-KOMIK-05
System HARUS menyimpan posisi baca terakhir per chapter per user (reading progress).
Guest: simpan di localStorage. Free/Premium User: simpan di DB.

### FR-KOMIK-06
System HARUS mendukung mode baca:
- Vertical scroll (webtoon)
- Horizontal flip (manga style)

### FR-KOMIK-07 — Premium Only
Premium User DAPAT mengaktifkan mode baca tambahan:
- Reading direction preference (LTR / RTL / webtoon) disimpan per akun

### FR-KOMIK-08
System HARUS mendukung search manga berdasarkan judul.
Min query length: 2 karakter. Rate limit: 30 request/menit per IP.

### FR-KOMIK-09
System HARUS mendukung filter manga berdasarkan genre.

### FR-KOMIK-10
System HARUS menampilkan manga populer (sorted by view count).

### FR-KOMIK-11
URL chapter lama /komik/{mangaId}/{chapterId} HARUS di-redirect 301 ke /chapter/{chapterId}.

---

## 5. Bookmark & History

### FR-BM-01
Free/Premium User DAPAT bookmark manga.
Max bookmark: tidak dibatasi.

### FR-BM-02
System HARUS menampilkan daftar bookmark user di /bookmark.

### FR-BM-03
System HARUS menyimpan reading history per user di /history.
Max history entries: 500 per user (FIFO — hapus yang terlama).

### FR-BM-04
User DAPAT menghapus item dari bookmark dan history.

### FR-BM-05
System HARUS sync bookmark/history real-time (bukan eventual — write langsung ke DB).

---

## 6. Subscription

### FR-SUB-01
System HARUS menyediakan 1 tier subscription: Premium (IDR 29.000/bulan).

### FR-SUB-02
User DAPAT berlangganan via iPaymu VA (primary, ID market). Payment gated by env vars.
No fallback gateway implemented at launch.

### FR-SUB-03
System HARUS meng-upgrade User.tier ke "premium" setelah pembayaran sukses.
Upgrade HARUS terjadi via webhook — bukan client-side callback.

### FR-SUB-04
System HARUS menampilkan status subscription di /account:
- Tier aktif
- Tanggal expire
- Tombol cancel

### FR-SUB-05
User DAPAT membatalkan subscription.
Akses premium TETAP aktif hingga akhir periode yang sudah dibayar.

### FR-SUB-06
System HARUS memberikan grace period 3 hari jika pembayaran gagal (recurring).
Setelah 3 hari: downgrade ke free tier.

### FR-SUB-07
System TIDAK BOLEH menyimpan data kartu kredit/debit user secara langsung.
Semua payment data dikelola provider (iPaymu).

### FR-SUB-08
System HARUS mengirim email konfirmasi setelah subscription sukses.
Delegasi ke Clerk atau provider email eksternal — bukan build sendiri.

---

## 7. Ads

### FR-ADS-01
Guest dan Free User HARUS melihat banner ads setiap 5 halaman di chapter reader.

### FR-ADS-02
Premium User TIDAK BOLEH melihat ads — ad slots TIDAK dirender ke DOM.

### FR-ADS-03
System HARUS menampilkan interstitial ad di akhir chapter (sebelum next chapter button aktif).
Frequency cap: max 1 interstitial per session per user.

### FR-ADS-04
Ads TIDAK BOLEH autoplay audio.

### FR-ADS-05
Max 3 ad units per halaman (Better Ads Standards compliance).

### FR-ADS-06
System HARUS menyediakan /ads.txt di root domain.

---

## 8. Push Notification

### FR-PUSH-01
Free/Premium User DAPAT opt-in push notification untuk chapter baru.
System HARUS meminta browser permission secara eksplisit — bukan auto-prompt.

### FR-PUSH-02
System HARUS mengirim push notification saat konten baru tersedia untuk judul
yang di-bookmark user.

### FR-PUSH-03
User DAPAT unsubscribe push notification kapan saja dari /account.

### FR-PUSH-04
Push notification payload HARUS mengandung: judul, deskripsi singkat, URL, icon.

---

## 9. Search & Discovery

### FR-SEARCH-01
System HARUS menyediakan global search manga dengan query parameter.

### FR-SEARCH-02
Search result HARUS ditampilkan dalam 2 detik untuk query normal.

### FR-SEARCH-03
System HARUS menyediakan halaman genre listing untuk manga.

### FR-SEARCH-04
System HARUS menyediakan halaman trending/populer (berdasarkan view atau bookmark count).

---

## 10. Account Management

### FR-ACC-01
User DAPAT melihat dan mengedit preferences di /account:
- Tema (dark/light/system)
- Reading direction default
- Genre favorit

### FR-ACC-02
User DAPAT menghapus akun.
Penghapusan HARUS cascade: bookmark, history, subscription, push subscription.

### FR-ACC-03
System HARUS menampilkan ringkasan subscription aktif di /account.

---

## 11. Admin / Internal

### FR-ADMIN-01
System HARUS menyediakan endpoint /api/cache/purge untuk trigger cache warming.
Diproteksi dengan x-cron-secret header.

### FR-ADMIN-02
System HARUS menyediakan endpoint /api/health untuk stats dasar:
- DB connection status
- Uptime

### FR-ADMIN-03
System HARUS menyediakan endpoint /api/cache/purge untuk invalidate cache per slug.
Diproteksi dengan x-cron-secret header.

---

## 12. Performance

### FR-PERF-01
LCP (Largest Contentful Paint) HARUS < 2.5 detik untuk pengguna Asia (Singapore/Jakarta edge).

### FR-PERF-02
Chapter images HARUS di-serve via Cloudflare edge cache (Cache-Control: public, max-age=86400).

### FR-PERF-03
Halaman manga detail HARUS menggunakan ISR dengan TTL minimum 30 menit.

### FR-PERF-04
System HARUS gracefully serve konten dari DB cache saat source API down.

### FR-PERF-05
Image proxy (/api/img) HARUS menolak URL di luar allowlist CDN domain.
Allowlist: img.komiku.org, yuucdn.net, uqni.net, imgsc.*.

---

## 13. SEO

### FR-SEO-01
Setiap halaman manga HARUS memiliki meta title, description, dan Open Graph tags.

### FR-SEO-02
System HARUS menyediakan sitemap XML dinamis untuk semua manga.

### FR-SEO-03
System HARUS menyediakan robots.txt yang mengizinkan Googlebot.

### FR-SEO-04
Semua redirect dari URL lama HARUS menggunakan HTTP 301 (permanent).

---

## 14. Privacy & Compliance

### FR-PRIV-01
System HARUS menampilkan halaman Privacy Policy di /privacy.

### FR-PRIV-02
System HARUS menampilkan GDPR consent banner untuk pengguna dari wilayah EU/EEA.

### FR-PRIV-03
User DAPAT request penghapusan data (right to erasure) via /account.

### FR-PRIV-04
System TIDAK BOLEH menjual atau membagikan data user ke pihak ketiga selain
Clerk (auth), iPaymu (payment), AdSense (ads).

---

## 15. Non-Functional (summary pointer)

Detail lengkap di docs/TECH_SPEC.md. Summary:

| Requirement | Target |
|-------------|--------|
| Availability | 99.5% uptime |
| Scale | 200–500+ concurrent users awal |
| Auth provider | Clerk (graceful degrade) |
| Hosting | Cloudflare Workers |
| DB | PostgreSQL via Prisma (Supabase) |
| Rate limit | Per endpoint, CF KV fixed-window |
| Security | WORKER_TOKEN + CRON_SECRET |

---

## 16. Out of Scope (v2 launch)

- Native mobile app (iOS/Android)
- Yearly subscription billing
- Multi-language UI (ID only untuk v2)
- Admin CMS panel (content managed via API/scraper)
- User-generated content (comments, ratings)
- Offline full download (hanya cache via PWA service worker)
