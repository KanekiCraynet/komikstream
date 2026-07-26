# Dokumentasi KomikStream

Indeks dokumentasi. Urut prioritas baca.

## Baca dulu

| Dokumen | Isi |
|---------|-----|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | **Sumber kebenaran teknis** — struktur, arsitektur runtime, penjelasan tiap modul kode, skema DB, env, build, utang teknis. |
| [`MIGRATION_RR7.md`](MIGRATION_RR7.md) | Riwayat & status migrasi Next.js 15 → React Router 7 (selesai). |

## Requirement (era "KuroManga" / desain Next.js)

Dokumen ini menggambarkan *intent* produk, bukan kode aktual. Nama produk di
sini "KuroManga" (nama awal); implementasi sekarang bernama "KomikStream".

| Dokumen | Isi |
|---------|-----|
| [`BRD.md`](BRD.md) | Business Requirements |
| [`PRD.md`](PRD.md) | Product Requirements |
| [`SRS.md`](SRS.md) | Software Requirements Specification |
| [`FRS.md`](FRS.md) | Functional Requirements Specification |
| [`TECH_SPEC.md`](TECH_SPEC.md) | Technical Spec lama (era Next) — delta RR7 ada di `ARCHITECTURE.md` |

## Operasional & dev history

| Dokumen | Isi |
|---------|-----|
| [`MAINTENANCE.md`](MAINTENANCE.md) | Catatan ops solo |
| [`DEV_NOTE.md`](DEV_NOTE.md) | Development notes |
| [`DEV_IMPLEMENTATION_PLAN.md`](DEV_IMPLEMENTATION_PLAN.md) | Rencana implementasi dari docs ke kode |
| [`UI_UX_ASURASCANS.md`](UI_UX_ASURASCANS.md) | Referensi UI (AsuraScans) |

## Catatan penamaan

- **KomikStream** — nama produk di UI (semua `meta()` route).
- **komikstream-rr7** — nama paket npm / repo branch ini.
- **KuroManga** — nama proyek awal, dipakai di dokumen requirement lama.
