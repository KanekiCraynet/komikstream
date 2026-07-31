# Dokumentasi KomikStream

---

## Source of Truth

- **ARCHITECTURE.md** — Struktur repo, arsitektur RR7, SSR, DB, env, workflow, build, dan deployment. Semua perubahan view/data source/filter/genre/navigation diwajibkan match code di file ini.
- **UI_UX_ASURASCANS.md** — Standar visual, layout, anatomi, dan token AsuraScans. Bukan referensi legal/brand, hanya spek CSS yang diekstrak.
- Semua audit evidence harus ditulis langsung ke ARCHITECTURE.md dan UI_UX jika visual/density berubah; *JANGAN* maintain audit harian terpisah kecuali butuh legal/severity evidence eksternal.
- **README.md** — Navigasi dokumen, linkage status, prosedur canonical verification.

## Product/Feature Aktual (2026-07-31)

- Product: **KomikStream** (UI/branding), repo/paket: **komikstream-rr7**. Codebase Next.js telah dimigrasikan ke React Router 7; dokumen Next.js hanya untuk intent historis.
- Sumber manga: **Sanka Vollerei** (API pull ke seed DB Prisma), endpoint: `prisma/seed.ts`.
- Public: `/`, `/manga`, `/manga/:slug?`, short/compatibility chapter URL.
- Auth: Clerk. Fail-soft, non-blocking mode (env kosong = feature mati, app jalan).
- Payment: iPaymu via webhook; fail-soft.
- Push: Web Push (VAPID). Disabled bila env kosong.

## Standar Filtering/Genre Terbaru

- Genre diambil dari **data manga DB**, didedup, urut alphabet, hasil fungsi pure extractGenres() (lihat `app/lib/manga-types.ts`).
- Khusus **type komik**: "manhwa", "manhua", "manga" TIDAK tampil di dropdown genre, sidebar genre, maupun filter katalog (lihat test regression).
- Semua menu genre, filter katalog, sidebar, mobile navigation sekarang update dinamis on reload karena loader DB/SSR, kecuali cache backend 5 menit untuk E2E dataset besar.

## Verification dan Visual Policy

- **JANGAN** klaim pixel parity dari SSR/curl/build doang; hanya valid jika screenshot live dan DOM diverifikasi.
- Perintah canonical:
  - `pnpm run typecheck`
  - `pnpm run test`
  - `pnpm run build`
  - `pnpm exec react-router dev` → screenshot + DOM visual
  - (Untuk test DB) lihat section di ARCHITECTURE.md + seed Sanka

## Maintenance dan Legacy

- Audit harian yang stale tidak dipertahankan. Temuan yang masih relevan diserap ke `ARCHITECTURE.md`; bukti visual masuk `UI_UX_ASURASCANS.md`.
- Untuk requirement lama, cek **BRD**, **PRD**, **SRS**, **FRS**, **TECH_SPEC** — semua dianggap niat historis, bukan kode live.

## Document Conventions (2026-07-31)

- Main repo: `/home/zee/komikstream-rr7`
- Semua change gate: lint, typecheck, test, build, HMR/dev, screenshot jika pixel/UX.

---

Terakhir update: 2026-07-31 (genre/type split, audit inline, navbar/genre/UX parity).
