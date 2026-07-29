# Dokumentasi KomikStream

Dokumentasi dipisah antara **kode aktual**, **audit evidence**, dan **requirement historis**. Jangan memakai dokumen historis sebagai deskripsi runtime tanpa membandingkan source aktif.

## 1. Source of truth

| Dokumen | Fungsi |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Struktur repo, runtime React Router 7, server/client boundary, route, module responsibility, DB, env, build, dan deployment. |
| [`AUDIT_2026-07-27.md`](AUDIT_2026-07-27.md) | Audit keseluruhan terbaru: findings severity, evidence `path:line`, quality gates, dependency/migration risks, dan prioritas kerja. |
| [`MIGRATION_RR7.md`](MIGRATION_RR7.md) | Riwayat migrasi Next.js 15 → React Router 7 dan compatibility notes. |

## 2. Current product behavior

- Product name: **KomikStream**.
- Source manga development: **Sanka Vollerei API**.
- Public catalog: `/`, `/manga`, `/manga/:slug`.
- Canonical chapter URL: `/:chapterId`, contoh `/nano-machine-chapter-310`.
- Compatibility chapter URL: `/chapter/:chapterId`.
- Auth provider: Clerk, disabled gracefully bila env kosong.
- Payment provider: iPaymu, disabled gracefully bila env kosong.
- Push provider: Web Push/VAPID, disabled gracefully bila env kosong.

## 3. Requirement historis

Dokumen berikut berasal dari era produk awal `KuroManga`/Next.js. Isinya menjelaskan intent dan requirement, bukan jaminan implementasi aktif:

| Dokumen | Isi |
|---|---|
| [`BRD.md`](BRD.md) | Business Requirements |
| [`PRD.md`](PRD.md) | Product Requirements |
| [`SRS.md`](SRS.md) | Software Requirements Specification |
| [`FRS.md`](FRS.md) | Functional Requirements Specification |
| [`TECH_SPEC.md`](TECH_SPEC.md) | Technical spec lama; delta RR7 ada di `ARCHITECTURE.md` |

## 4. UI/UX dan operasi

| Dokumen | Isi/status |
|---|---|
| [`UI_UX_ASURASCANS.md`](UI_UX_ASURASCANS.md) | Prinsip referensi visual; bukan clone brand/layout. |
| [`MAINTENANCE.md`](MAINTENANCE.md) | Catatan maintenance/operasi. Verifikasi command terhadap `package.json`. |
| [`DEV_NOTE.md`](DEV_NOTE.md) | Catatan development historis. |
| [`DEV_IMPLEMENTATION_PLAN.md`](DEV_IMPLEMENTATION_PLAN.md) | Rencana implementasi historis; status aktual lihat audit terbaru. |
| [`UI_UX_TORAKA.md`](UI_UX_TORAKA.md) | Referensi desain historis. |

## 5. Verification policy

Perintah canonical:

```bash
pnpm run typecheck
pnpm run test
pnpm run build
pnpm exec prisma validate
pnpm audit --prod
```

Untuk local development dengan PostgreSQL:

```bash
pnpm run db:push
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/komikstream' \
  node --experimental-strip-types prisma/seed.ts
pnpm run dev
```

Visual screenshot fallback bila Hermes browser capture timeout:

```bash
./scripts/capture-home.sh http://127.0.0.1:5173/ /tmp/komikstream-home.png
```

Jangan menyebut visual verification berhasil dari `curl`, SSR status, atau build saja. Screenshot harus benar-benar di-capture dan diinspeksi.

## 6. Naming

- **KomikStream** — product/UI name.
- **komikstream-rr7** — package/repository name.
- **KuroManga** — historical requirement name only.

## 7. Document maintenance

Setiap perubahan route, env, data source, schema, feature, atau command harus memperbarui `ARCHITECTURE.md` dan bila relevan audit/status document. Test result wajib berasal dari command terbaru, bukan copy dari dokumen lama.
