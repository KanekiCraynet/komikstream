# Technical Specification
# KuroManga — Manga Platform Rewrite

Version: 1.1
Date: 2026-07-06
Owner: Solo Developer
Linked to: docs/PRD.md v1.1, docs/BRD.md v1.0
Status: Sprint 6 complete — build verified

---

## 1. Architecture Overview

```
Internet
   │
   ▼
Cloudflare Workers (edge)
  ├── Rate limiting (KV fixed-window)
  ├── Ad frequency cap (KV per-session)
  ├── Cache (CF Cache API)
  ├── WORKER_TOKEN injection
  └── Route: /api/img?url= (image proxy)
   │
   ▼
Cloudflare Workers (runtime)
  Next.js 15 App Router
  ├── src/middleware.ts (Edge Runtime)
  │     Clerk auth only — no tier inject, no img redirect
  ├── src/app/ (pages + API routes)
  └── Prisma 7 → Supabase PostgreSQL
   │
   ▼
External Sources
  ├── Sansekai API (manga data)
  ├── Clerk (auth tokens)
  ├── iPaymu (payment)
  └── AdSense / Ezoic (ads JS)
```


---

## 2. Stack Decisions

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 15 App Router | Already in place, ISR + RSC + edge-compatible |
| Language | TypeScript strict | Already in place, 0 errors baseline |
| DB ORM | Prisma 7 | Already in place, WASM edge support |
| DB | PostgreSQL (Supabase) | Already in place, connection pooler via pg |
| Auth | Clerk | Already in place, graceful degrade pattern |
| Edge Proxy | CF Workers + OpenNext | Already in place |

| Payment | iPaymu (env-gated) | New — VA-based, no SDK, gated by env presence |
| Push Notif | Web Push API (vapid) | New — PWA native, no third-party |
| Ads | Google AdSense | New — standard script, no SDK |
| Rate Limit | CF KV fixed-window | Already in place (kv-rate-limit.ts) |
| Validation | Zod | Extend existing pattern in src/lib/validations/ |
| Monitoring | CF Analytics | Already in place |

No new infra services added. All new features run on existing Cloudflare runtime.

---

## 3. DB Schema Migration (delta)

### 3.1 User model — add fields

```prisma
model User {
  // existing fields preserved ...
  tier          String   @default("free")  // "free" | "premium"
  preferences   Json?    // { genres: string[], readingDir: "ltr"|"rtl"|"webtoon", theme: "dark"|"light" }
  lastSeenAt    DateTime?
  Subscription  Subscription?
  PushSubs      PushSubscription[]
}
```

### 3.2 New: Subscription model

```prisma
model Subscription {
  id          String    @id @default(dbgenerated("(gen_random_uuid())::text"))
  userId      String    @unique
  tier        String    // "premium"
  status      String    // "active" | "cancelled" | "expired" | "grace"
  provider    String    // "ipaymu"
  externalId  String?   // provider order/subscription ID
  startedAt   DateTime
  expiresAt   DateTime?
  cancelledAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  User        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([expiresAt])
}
```

### 3.3 New: PushSubscription model

```prisma
model PushSubscription {
  id        String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  User      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### 3.4 Migration plan

1. Create migration: prisma migrate dev --name add_subscription_push
2. Backfill User.tier = "free" for all existing rows (migration SQL):
   UPDATE "User" SET tier = 'free' WHERE tier IS NULL;
3. Run in CI: prisma migrate diff --exit-code (detect uncommitted schema drift)
4. Deploy migration before app deploy.

---

## 4. Zod Schemas (new — required for JSON columns)

Location: src/lib/validations/

```typescript
// src/lib/validations/komik.ts
export const KomikChapterEntrySchema = z.object({
  id: z.string(),
  chapterId: z.string(),
  title: z.string(),
  date: z.string().optional(),
});
export const KomikChaptersSchema = z.array(KomikChapterEntrySchema);
export const KomikGenresSchema = z.array(z.string());

// src/lib/validations/chapter.ts
export const ChapterImageSchema = z.object({
  url: z.string().url(),
  page: z.number().int().nonneg(),
});
export const ChapterImagesSchema = z.array(ChapterImageSchema);

// src/lib/validations/user.ts
export const UserPreferencesSchema = z.object({
  genres: z.array(z.string()).default([]),
  readingDir: z.enum(["ltr", "rtl", "webtoon"]).default("ltr"),
  theme: z.enum(["dark", "light", "system"]).default("system"),
}).optional();
```

Usage pattern: parse at read time (after DB fetch), not write time only.

---

## 5. API Contracts (new endpoints)

All new endpoints follow existing AppError / errorToResponse pattern.
All request bodies validated with Zod before processing.

### 5.1 POST /api/subscription/create

Request:
```json
{ "plan": "monthly" | "yearly", "provider": "ipaymu" }
```

Response 200:
```json
{
  "provider": "ipaymu",
  "redirectUrl": "<va_url>"
}
```

Response 400: validation error
Response 401: not authenticated
Response 409: active subscription already exists

Flow (iPaymu):
1. Auth check (Clerk)
2. Check existing active subscription → 409 if found
3. Create iPaymu VA transaction via server API
4. Return VA URL to client
5. Client opens VA payment page
6. iPaymu calls /api/subscription/webhook on success

### 5.2 POST /api/subscription/webhook

Headers: x-ipaymu-signature or configured webhook secret.
Body: raw (iPaymu notification object)

Flow:
1. Verify signature (iPaymu webhook secret)
2. If payment success: upsert Subscription row, set User.tier = "premium"
3. If payment expired/cancelled: set Subscription.status accordingly
4. Grace period: on first failure, set status = "grace", schedule check at +3 days
5. Return 200

### 5.3 GET /api/subscription/status

Response 200:
```json
{
  "tier": "free" | "premium",
  "subscription": {
    "status": "active" | "cancelled" | "expired" | "grace",
    "expiresAt": "<iso>",
    "provider": "ipaymu"
  } | null
}
```

Response 401: not authenticated

### 5.4 POST /api/push/subscribe

Request:
```json
{
  "endpoint": "<url>",
  "keys": { "p256dh": "<key>", "auth": "<key>" }
}
```

Response 201: subscribed
Response 400: validation error
Response 401: not authenticated

### 5.5 POST /api/push/unsubscribe

Request: { "endpoint": "<url>" }
Response 200: removed
Response 404: not found

### 5.6 POST /api/cache/purge

Headers: x-cron-secret: <CRON_SECRET>
Body: { "type": "komik" | "chapter", "slug": "<id>" }

Clears Next.js revalidateTag or revalidatePath for given slug.

### 5.7 GET /api/health

Auth: none
Response 200: { status: "ok", db: "connected", uptime }
Response 503: DB disconnected

---

## 6. Middleware (src/middleware.ts)

Clerk auth only. Edge Runtime — no Prisma/Zod/Node modules.

- `/account(.*)` → requires auth
- `/api/subscription(.*)` → requires auth (except webhook)
- `/api/push(.*)` → requires auth
- `/api/img/*` → NOT handled by middleware (moved to route handler in Sprint 6)

Middleware imports only: `@clerk/nextjs`, `next/server`, `src/lib/clerk-flags.ts`.

---

## 7. Ads Integration

Strategy: server-side ad slot rendering with client-side AdSense script.

### 7.1 Ad placement in chapter reader

```
Page 1-4    → no ad
Page 5      → banner ad slot (below page 5 image)
Page 6-9    → no ad
Page 10     → banner ad slot
... (every 5 pages)
Last page   → interstitial trigger (before next chapter button activates)
```

### 7.2 Implementation

- AdSense script loaded in src/app/layout.tsx (conditional: tier !== "premium")
- Ad slot components: src/components/ads/BannerAd.tsx, InterstitialAd.tsx
- Server-side: if user.tier === "premium", don't render ad slots at all
  (not just CSS hide — remove from DOM to prevent layout shift)
- Frequency cap for interstitial: CF KV key `ad:interstitial:{session_id}`,
  TTL = session duration. Max 1 per session.

### 7.3 AdSense requirements checklist

- robots.txt must allow Googlebot
- Privacy Policy page required
- No ad stuffing (max 3 ad units per page)
- ads.txt file at kuromanga.me/ads.txt

---

## 8. Subscription Payment Flow

### 8.1 iPaymu VA (primary, ID users)

```
Client                    Server                   iPaymu
  │                          │                          │
  ├── POST /api/sub/create ──►│                          │
  │                          ├── createVA(plan) ────────►│
  │                          │◄── { va_url } ───────────┤
  │◄── { redirectUrl } ──────┤                          │
  ├── open VA URL ───────────────────────────────────►  │
  │                          │◄── webhook notification ─┤
  │                          ├── update DB tier ────────┤
  │                          ├── 200 OK ───────────────►│
```

iPaymu: direct HTTP API call. No SDK dependency.
Server-side only — IPAYMU_API_KEY never exposed to client.

### 8.2 Environment variables

```
IPAYMU_VA=                      # iPaymu virtual account
IPAYMU_API_KEY=                 # server-side only
IPAYMU_URL=https://sandbox.ipaymu.com/api/v2
IPAYMU_SANDBOX=true
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # web push (client-side)
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@komikstream.space
CRON_SECRET=                    # cache purge auth
```

---

## 9. Push Notification Flow

Tech: Web Push API + VAPID keys. No Firebase/OneSignal dependency.

```
Browser                   Server                   CF Cron
  │                          │                          │
  ├── requestPermission() ───┤                          │
  ├── subscribe(vapidKey) ───┤                          │
  ├── POST /api/push/sub ───►│ store endpoint in DB     │
  │                          │                          │
  │                  ◄── CF Cron trigger (daily) ───────┤
  │                          ├── fetch new chapters     │
  │                          ├── query push subs for    │
  │                          │   bookmarked manga       │
  │                          ├── web-push.sendNotif()──►│
  │◄── Push notification ────┤                          │
```

Library: web-push npm package (Node/Edge compatible).
Cron: CF Workers Cron Trigger, daily 08:00 WIB (00:00 UTC).
Payload: { title, body, icon, url } — max 4KB.

---

## 10. Cache Strategy

| Content | ISR TTL | CF Cache | DB Cache TTL |
|---------|---------|----------|-------------|
| Homepage latest | 5 min | 5 min | 30 min |
| Manga detail | 30 min | 1 hour | 6 hours |
| Chapter images | 1 hour | 24 hours | 7 days |
| Search | 3 min | none | none |
| User data | no-cache | none | realtime |
| Subscription status | no-cache | none | realtime |

Source API down → DB cache serves stale content.
Cache behavior is controlled by route response headers and deployment platform configuration.
No cache-warm workflow is deployed; add one only with a real protected endpoint.

---

## 11. Image Proxy

`/api/img` route handler at `src/app/api/img/route.ts`. Node runtime.
Not middleware — moved from middleware plan to route handler in Sprint 6.

1. Parse + validate url param
2. Fetch from origin (timeout 30s, retry 1)
3. Set Cache-Control: public, max-age=86400, s-maxage=86400
4. Return proxied image

CF Worker: image proxy not deployed at edge. All proxy runs in origin route handler.
Allowlist: known CDN domains (yuucdn.net, uqni.net, imgsc, img.komiku.org handled).

`next.config.ts` has no `images.remotePatterns`; reader uses native `<img>` for dynamic CDN images.

---

## 12. CI/CD Changes

### 12.1 CI workflow

```yaml
- name: Prisma migrate diff
  run: pnpm exec prisma migrate diff --exit-code --from-schema-datasource --to-schema-datamodel prisma/schema.prisma
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Use only when CI has a real disposable database or production-compatible migration policy.

### 12.3 Lint script scope

package.json:
```json
"lint": "eslint src"
```

Reduces lint time from >90s to ~15s.

---

## 13. Security Hardening

### 13.1 .gitignore additions

```
wp-config-kuromanga.php
*.docker.log
kuromanga_docker.log
```

### 13.2 New secrets to rotate on rewrite branch

- WORKER_TOKEN: generate new 32-byte random hex
- CRON_SECRET: generate new 32-byte random hex
- Clerk keys: use rewrite-specific app in Clerk dashboard

### 13.3 Admin endpoint protection

All CRON-gated routes (/api/cache/purge): verify x-cron-secret header.
Add explicit check: reject if header missing, return 403.
Existing migrate + seed routes: audit and add check if not present.

---

## 14. File Structure (current)

```
src/
├── app/
│   ├── api/
│   │   ├── cache/
│   │   │   └── purge/route.ts
│   │   ├── health/route.ts
│   │   ├── push/
│   │   │   ├── subscribe/route.ts
│   │   │   └── unsubscribe/route.ts
│   │   ├── img/route.ts              ← image proxy (Node runtime)
│   │   └── webhooks/clerk/route.ts
│   ├── manga/[slug]/page.tsx
│   ├── chapter/[id]/page.tsx
│   ├── account/page.tsx
│   ├── privacy/page.tsx
│   ├── dmca/page.tsx
│   ├── contact/page.tsx
│   ├── terms/page.tsx
│   ├── layout.tsx                    ← includes GdprBanner
│   └── middleware.ts                 ← Edge Runtime, Clerk only
├── components/
│   ├── GdprBanner.tsx                ← localStorage consent banner
│   └── ads/
│       └── BannerAd.tsx
├── lib/
│   ├── db.ts                         ← Prisma client
│   ├── push.ts                       ← web-push wrapper
│   ├── clerk-flags.ts                ← Edge-safe, no imports
│   └── validations/
│       ├── komik.ts
│       ├── chapter.ts
│       └── user.ts
docs/
├── PRD.md
├── BRD.md
├── SRS.md
├── TECH_SPEC.md
├── FRS.md
├── DEV_NOTE.md
├── DEV_IMPLEMENTATION_PLAN.md
└── MAINTENANCE.md
```

---

## 15. Dependencies Added

```json
"web-push": "^3.6.7"
```

Dev:
```json
"@types/web-push": "^3.6.x"
```

No payment SDK deps. Payment via iPaymu HTTP API.

---

## 16. Resolved Questions

RQ-1: iPaymu VA chosen. One-time charge per period, no recurring token.
       iPaymu URL = `https://sandbox.ipaymu.com/api/v2` (env-configurable).
       Payment gate decided.

RQ-2: No CF Workers Cron Trigger. Push notif requires an external scheduler.

RQ-3: AdSense confirmed. Ezoic not needed. Ads.txt deferred (YAGNI).

RQ-4: Image proxy route handler (Node) not middleware (Edge).
       `/api/img` runs via Route Handler, not middleware or CF Worker.

RQ-5: No internal dashboard endpoint. Health endpoint (`/api/health`)
       covers monitoring needs.
