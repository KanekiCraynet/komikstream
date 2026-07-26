# Arsitektur — KomikStream (React Router 7)

Dokumen ini menjelaskan struktur, arsitektur runtime, dan setiap modul kode di
branch `migration/react-router-v7`. Ini adalah **sumber kebenaran teknis** untuk
kode yang berjalan sekarang. Dokumen requirement lama (SRS/PRD/BRD/FRS/TECH_SPEC)
memakai nama produk "KuroManga" dan menggambarkan desain era Next.js 15 — pakai
sebagai referensi *intent*, bukan sebagai deskripsi kode aktual.

- Nama produk di UI: **KomikStream** (lihat semua `meta()` route).
- Nama repo/paket: `komikstream-rr7`.
- Nama di docs requirement lama: `KuroManga`.

---

## 1. Ringkasan

Platform baca manga: katalog, reader multi-mode, bookmark, riwayat baca,
langganan premium (bebas iklan) via iPaymu, dan web push notification.
Autentikasi via Clerk. Semua fitur berbayar/auth **fail-safe**: kalau env
credential tidak diset, fitur mati dengan sopan (bukan crash).

### Stack

| Lapisan     | Teknologi                                        |
|-------------|--------------------------------------------------|
| Framework   | React Router 7 (framework mode, SSR)             |
| Bundler     | Vite 8                                            |
| Bahasa      | TypeScript 5.9 (strict, `verbatimModuleSyntax`)  |
| ORM         | Prisma 7 + `@prisma/adapter-pg` (driver adapter) |
| Database    | PostgreSQL                                        |
| Auth        | Clerk (`@clerk/react-router` 3.5)                |
| Pembayaran  | iPaymu (redirect payment + webhook)              |
| Push        | Web Push (VAPID) via `web-push`                  |
| Styling     | Tailwind CSS 4 (`@tailwindcss/vite`)             |
| Deploy      | Netlify (`@netlify/vite-plugin-react-router`)    |
| Test        | Vitest                                            |
| Runtime     | Node 22 (lihat `.node-version`)                  |

---

## 2. Struktur direktori

```
komikstream-rr7/
├── app/                      # Aplikasi React Router 7 (SATU-SATUNYA app aktif)
│   ├── root.tsx              # Root layout, ClerkProvider, ErrorBoundary
│   ├── routes.ts             # Route manifest (config-based routing)
│   ├── app.css               # Entry Tailwind
│   ├── routes/               # Modul route — 1 file = 1 URL (loader/action/UI)
│   ├── components/           # Komponen React reusable
│   │   └── MangaReader.tsx   # Reader interaktif (client component)
│   ├── lib/                  # Logika non-UI
│   │   ├── *.server.ts       # SERVER-ONLY (DB, auth, iPaymu, push, subscription)
│   │   ├── progress.ts       # Progres baca guest (localStorage) — client
│   │   ├── progress-utils.ts # Helper murni (clampPage) — dites unit
│   │   └── actions/          # Wrapper fetch sisi-client
│   └── generated/prisma/     # Prisma client (di-generate; gitignored)
├── prisma/
│   ├── schema.prisma         # Model DB
│   ├── seed.ts               # Seed E2E lokal (raw pg, tanpa Prisma client)
│   └── migrations/           # Migrasi SQL berurutan
├── public/
│   ├── sw.js                 # Service worker (push notification)
│   └── ads.txt
├── docs/                     # Dokumentasi ini
├── .github/                  # CI/CD, issue/PR templates
├── react-router.config.ts    # Konfigurasi RR7 (ssr: true)
├── vite.config.ts            # Plugin Vite (tailwind, rr7, tsconfigPaths, netlify)
├── netlify.toml              # Build & publish Netlify
├── tsconfig.json             # Alias ~/* → app/*; exclude src/, build
└── package.json
```

> **Catatan `src/`**: direktori legacy Next.js 15 sudah **dihapus dari git**
> (`git ls-files src/` = 0). Yang tersisa di disk hanyalah `src/generated/prisma`
> (artefak generate, gitignored) dari build lama. Aman dihapus; tidak dipakai.
> Sumber Next.js lama bisa dilihat lewat history: `git show 7801f84^:src/app/...`.

---

## 3. Arsitektur runtime

### 3.1 Model routing (config-based)

RR7 memakai **config-based routing** — bukan file-based. Peta URL→modul
didefinisikan eksplisit di `app/routes.ts`. Nama file route (mis.
`api.subscription.create.ts`) hanya konvensi; yang mengikat URL adalah entri di
`routes.ts`.

Tiap modul route bisa mengekspor:
- `loader` — dijalankan di server saat GET (data untuk SSR).
- `action` — dijalankan di server saat POST/PUT/DELETE (mutasi).
- `meta` — tag `<title>`/meta.
- `default` — komponen React yang dirender (route API tidak punya ini).
- Tipe `Route.*` di-generate ke `.react-router/types/` oleh `react-router typegen`.

### 3.2 Batas server/client

Aturan keras: **file `*.server.ts` tidak boleh masuk bundle client.** Rahasia
(DB URL, Clerk secret, iPaymu key) hidup hanya di modul server. Vite/RR7
menghapus kode server dari bundle browser selama import mengalir lewat
`loader`/`action`, bukan komponen.

Contoh pola aman ada di `root.tsx`: keputusan Clerk aktif/tidak dibuat di
`loader` (server); komponen `App` hanya membaca `loaderData`, sehingga bundle
client tidak pernah meng-import `auth.server`.

### 3.3 Alur request khas (SSR + hydration)

```
Browser GET /manga
   → RR7 server memanggil loader manga._index (query Prisma)
   → HTML dirender di server + data di-serialize
   → Browser hydrate, navigasi berikutnya via fetch loader (SPA-like)
```

### 3.4 Alur data / progres baca

Progres baca punya dua jalur:
- **Guest**: disimpan di `localStorage` (`app/lib/progress.ts`), maksimal 100 entri.
- **Login**: di-`POST` ke `/api/history` (debounce 500ms di reader), disimpan ke tabel `History`.

`MangaReader` memakai `clampPage()` (`progress-utils.ts`) agar halaman tersimpan
tidak pernah keluar rentang gambar chapter.

---

## 4. Modul kode — penjelasan per file

### 4.1 Root & konfigurasi

| File | Peran |
|------|-------|
| `app/root.tsx` | Document shell (`<html>`), font preconnect, `ClerkProvider` kondisional, `ErrorBoundary` global (404 + error dev). Middleware Clerk hanya dipasang bila `clerkEnabled`. |
| `app/routes.ts` | Manifest 21 route: 12 halaman + 9 endpoint API di bawah prefix `/api`. |
| `app/app.css` | Entry Tailwind 4. |
| `react-router.config.ts` | `ssr: true` — semua route dirender server-side. |
| `vite.config.ts` | Plugin: Tailwind, RR7, tsconfig-paths, Netlify. |
| `tsconfig.json` | Alias `~/*` → `app/*`. Exclude `src/`, `build/`. Strict. |

### 4.2 Library server (`app/lib/*.server.ts`)

| File | Ekspor | Penjelasan |
|------|--------|------------|
| `db.server.ts` | `prisma` | Singleton PrismaClient dengan `PrismaPg` adapter (`DATABASE_URL`). Di-cache di `globalThis` saat non-produksi agar hot-reload tidak membuka koneksi baru terus. |
| `auth.server.ts` | `clerkEnabled`, `getCurrentUserId`, `requireCurrentUserId`, `requireAuth`, re-export Clerk | `clerkEnabled` = ada `CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`. `getCurrentUserId` memetakan Clerk userId → user DB lokal (upsert + refresh `lastSeenAt`); mengembalikan `null` untuk guest/disabled. `requireCurrentUserId` melempar `UNAUTHORIZED`/`AUTH_DISABLED`. |
| `ipaymu.server.ts` | `paymentEnabled`, `createRedirectPayment`, `verifyIpaymuSignature` | Integrasi iPaymu. `sign()` membuat HMAC-SHA256 sesuai skema iPaymu (`method:va:sha256(body):apiKey`). `verifyIpaymuSignature` memakai `timingSafeEqual` (anti timing attack). Base URL sandbox/produksi via `IPAYMU_SANDBOX`. |
| `subscription.server.ts` | `getSubscriptionStatus`, `cancelSubscription`, `activateSubscription`, `expireSubscription` | State langganan. `activateSubscription` **idempoten** (webhook replay tidak memperpanjang langganan aktif) dan transaksional (subscription + `user.tier` diubah atomik). `getSubscriptionStatus` menghormati periode `grace`. |
| `push.server.ts` | `pushEnabled`, `subscribeUser`, `unsubscribeUser`, `sendNotification` | Web Push VAPID. Aktif hanya bila `VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY` diset. Subscribe = upsert by `endpoint`. |

### 4.3 Library client / murni

| File | Peran |
|------|-------|
| `progress-utils.ts` | `clampPage(stored, total)` — fungsi murni, membatasi halaman ke `[0, total-1]`. Ada unit test. |
| `progress.ts` | Progres baca guest di `localStorage` (`getChapterPage`/`setChapterPage`), cap 100 entri. Client-only. |
| `actions/history.ts` | `upsertHistory(contentId, lastPage)` — `POST /api/history` dari browser. |
| `manga.server.ts` | `parseImages(raw)` — validasi array URL gambar dari kolom JSON Prisma (menyaring non-string/kosong). Ada unit test. Namanya `.server` tapi isinya murni; dipakai loader chapter. |

### 4.4 Komponen

| File | Peran |
|------|-------|
| `components/MangaReader.tsx` | Reader interaktif. 4 mode baca (vertical/horizontal/ltr/rtl), navigasi keyboard (←/→), resume ke halaman terakhir, `IntersectionObserver` untuk melacak halaman aktif di mode vertical, sisip slot iklan tiap 5 gambar untuk tier `free` (premium bebas iklan), debounce sync history 500ms bila `authenticated`. |

### 4.5 Route halaman (UI)

| URL | File | Loader/Action |
|-----|------|---------------|
| `/` | `home.tsx` | — (statis, hero + CTA) |
| `/manga` | `manga._index.tsx` | loader: 50 komik terbaru + cover |
| `/manga/:slug` | `manga.$slug.tsx` | loader: detail + daftar chapter (404 bila tidak ada) |
| `/chapter/:chapterId` | `chapter.$chapterId.tsx` | loader: gambar chapter → `MangaReader` |
| `/search` | `search.tsx` | loader: cari `?q=` (contains, case-insensitive) |
| `/bookmark` | `bookmark.tsx` | loader+action: list berpaginasi + hapus bookmark |
| `/history` | `history.tsx` | loader+action: list berpaginasi + hapus/clear |
| `/account` | `account.tsx` | loader+action: profil, status langganan, cancel, hapus akun |
| `/sign-in/*` | `sign-in.tsx` | Clerk `<SignIn>` (fallback bila disabled) |
| `/sign-up/*` | `sign-up.tsx` | Clerk `<SignUp>` (fallback bila disabled) |
| `/contact` `/dmca` `/privacy` `/terms` | masing-masing | Statis |

### 4.6 Route API (`/api/*`)

| URL | File | Method | Fungsi |
|-----|------|--------|--------|
| `/api/history` | `api.history.tsx` | POST | Upsert progres baca (401 bila tidak login) |
| `/api/bookmarks` | `api.bookmarks.ts` | GET/POST | List berpaginasi / toggle bookmark |
| `/api/health` | `api.health.ts` | GET | Health check: uptime, versi, cek DB (`SELECT 1`), 200/503 |
| `/api/push/subscribe` | `api.push.subscribe.ts` | POST | Simpan subscription push (validasi endpoint+keys) |
| `/api/push/unsubscribe` | `api.push.unsubscribe.ts` | POST | Hapus subscription push |
| `/api/subscription/create` | `api.subscription.create.ts` | POST | Buat pembayaran iPaymu (503 bila payment disabled) |
| `/api/subscription/status` | `api.subscription.status.ts` | GET | Status langganan user |
| `/api/subscription/webhook` | `api.subscription.webhook.ts` | POST | Callback iPaymu (verifikasi tanda tangan) |
| `/api/webhooks/clerk` | `api.webhooks.clerk.ts` | POST | Webhook Clerk (svix-verified); hapus user DB saat `user.deleted` |

---

## 5. Skema database

Enum: `Tier` (free/premium), `SubscriptionStatus` (active/cancelled/expired/grace),
`PaymentProvider` (ipaymu).

| Model | Peran | Relasi / index penting |
|-------|-------|------------------------|
| `User` | Akun (Clerk-linked). `clerkId` & `email` unique, `tier`, `preferences` JSON, `lastSeenAt` | punya subscriptions, pushSubscriptions, bookmarks, histories |
| `Subscription` | Langganan berbayar | `externalId` unique (idempotensi webhook), index `[userId, status]` |
| `PushSubscription` | Endpoint web push | `endpoint` unique |
| `Komik` | Metadata manga; `slug` unique; `genres`/`chapters` JSON | punya komikChapters |
| `KomikChapter` | Cache chapter; `chapterId` unique; `images` JSON | index `[komikId]` |
| `Bookmark` | Bookmark user | unique `[userId, contentId, contentType]` |
| `History` | Progres baca | unique `[userId, contentId, contentType]`, index `[userId, updatedAt]` |

Semua relasi ke `User` memakai `onDelete: Cascade` — hapus user membersihkan
bookmark/history/subscription otomatis.

---

## 6. Konfigurasi & environment

Salin `.env.example` → `.env`. Grup variabel:

| Grup | Variabel | Efek bila kosong |
|------|----------|------------------|
| Database | `DATABASE_URL` | App tidak bisa jalan |
| Auth | `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET` | Auth mati (guest-only), sign-in/up tampil "disabled" |
| Payment | `IPAYMU_VA`, `IPAYMU_API_KEY`, `IPAYMU_URL`, `IPAYMU_SANDBOX` | Endpoint langganan balas 503/disabled |
| Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Push notification mati |
| App | `APP_URL` | Default `http://localhost:3000` (return/notify URL iPaymu) |

> **Runtime gotcha**: `react-router-serve` **tidak memuat `.env`**. Untuk
> `pnpm run start`, pass env inline / export dulu (mis. `DATABASE_URL`).

---

## 7. Build, jalankan, test

| Perintah | Aksi |
|----------|------|
| `pnpm run dev` | Vite dev server (RR7 framework mode) |
| `pnpm run build` | `prisma generate` + `react-router build` |
| `pnpm run start` | `react-router-serve ./build/server/index.js` |
| `pnpm run test` | Vitest (unit: `parseImages`, `verifyIpaymuSignature`) |
| `pnpm run typecheck` | `react-router typegen && tsc` |
| `pnpm run db:generate` | Generate Prisma client → `app/generated/prisma` |
| `pnpm run db:migrate` | `prisma migrate dev` |
| `pnpm run db:push` | `prisma db push` |

DB lokal: `docker run -d --name komikstream-pg -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:16-alpine`.
Seed E2E: `DATABASE_URL=... node --experimental-strip-types prisma/seed.ts` (raw
pg; seed sengaja tidak meng-import Prisma client karena client generate memakai
import ESM tanpa ekstensi yang tak bisa di-resolve node polos di luar Vite).

---

## 8. Deploy

Netlify via `@netlify/vite-plugin-react-router`. `netlify.toml`: build
`pnpm run build`, publish `build/client`. Push branch → preview deploy.

---

## 9. Utang teknis & catatan (per audit terakhir)

Terverifikasi pada branch ini:

1. ~~Link mati `/komik/:id`~~ **FIXED** — route `komik.$id.tsx` me-resolve id
   sebagai chapterId → `/chapter/:id`, lalu komik id/slug → `/manga/:slug`,
   fallback `/manga`. E2E: 302 semua varian.
2. ~~`chapter.$chapterId.tsx` hardcode~~ **FIXED** — loader ambil
   `getCurrentUserId` + `getSubscriptionStatus` + `History.lastPage`;
   `tier`/`authenticated`/`initialPage` kini nyata. Guest path tetap default.
   Catatan: jalur login belum di-E2E (butuh Clerk keys nyata — lihat Sisa #5).
3. **`MangaReader.tsx`** masih ada `'use client'` (no-op di RR7, sisa Next) dan
   gaya berbeda (single-quote/no-semicolon) dari sisa app (double-quote/semicolon).
4. **Branding ganda** — UI "KomikStream", docs lama "KuroManga", paket
   `komikstream-rr7`. Perlu diseragamkan.
5. **`src/` di disk** hanya artefak generate lama; aman dihapus.

Status positif: `pnpm run typecheck` bersih, `pnpm run test` 4/4 hijau, migrasi
Next→RR7 fungsional selesai (21 route keport).
