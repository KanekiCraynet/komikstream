# 📚 KuroManga

Website untuk membaca komik (manhwa, manhua, manga) dan streaming anime dengan subtitle Indonesia.

<!-- Badges -->
[![CI](https://github.com/KanekiCraynet/komikstream/actions/workflows/ci.yml/badge.svg)](https://github.com/KanekiCraynet/komikstream/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/KanekiCraynet/komikstream/actions/workflows/e2e.yml/badge.svg)](https://github.com/KanekiCraynet/komikstream/actions/workflows/e2e.yml)
[![Deploy Production](https://github.com/KanekiCraynet/komikstream/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/KanekiCraynet/komikstream/actions/workflows/deploy-production.yml)
[![codecov](https://codecov.io/gh/KanekiCraynet/komikstream/branch/main/graph/badge.svg)](https://codecov.io/gh/KanekiCraynet/komikstream)

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?style=flat-square&logo=prisma)

---

## ✨ Fitur

- 📚 **Baca Komik** - Manhwa, Manhua, dan Manga dengan image viewer
- 🎬 **Streaming Anime** - Nonton anime dengan berbagai resolusi
- 🔍 **Pencarian** - Cari komik dan anime berdasarkan judul
- 🔖 **Bookmark** - Simpan favorit (localStorage, sync dengan DB jika login)
- 📜 **History** - Riwayat baca/tonton dengan progress tracking
- 🌙 **Dark/Light Mode** - Toggle tema sesuai preferensi
- 🔐 **Authentication** - Login via Email atau Google (Clerk) - **Optional!**
- 📱 **Responsive** - Mobile-first design
- ✨ **Animations** - Smooth transitions dengan Framer Motion
- 📄 **Pagination** - Navigasi halaman untuk list yang panjang

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **State** | [Zustand](https://github.com/pmndrs/zustand) |
| **Data Fetching** | [TanStack Query](https://tanstack.com/query) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **Auth** | [Clerk](https://clerk.com/) *(optional)* |
| **Database** | [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://prisma.io/) *(optional)* |
| **API Source** | [Sansekai API](https://api.sansekai.my.id/) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm atau yarn
- (Optional) Akun [Clerk](https://clerk.com/) untuk autentikasi
- (Optional) Akun [Supabase](https://supabase.com/) untuk database

### Quick Start (Tanpa Auth/Database)

```bash
# 1. Clone repository
git clone https://github.com/KanekiCraynet/komikstream.git
cd komikstream

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

> 📝 **Note**: Aplikasi dapat berjalan tanpa konfigurasi Clerk atau Supabase. Bookmark dan history akan tersimpan di localStorage.

### Full Setup (Dengan Auth & Database)

```bash
# 1. Clone repository
git clone https://github.com/KanekiCraynet/komikstream.git
cd komikstream

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env

# 4. Edit .env dengan kredensial Anda:
# - DATABASE_URL (dari Supabase)
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (dari Clerk)
# - CLERK_SECRET_KEY (dari Clerk)

# 5. Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# 6. Run development server
npm run dev
```

### Docker Setup

```bash
# Development dengan hot reload
docker-compose -f docker-compose.dev.yml up

# Production build
docker-compose up -d

# Build image only
docker build -t KuroManga .
```

---

## 📁 Project Structure

```
├── .github/
│   ├── workflows/          # GitHub Actions CI/CD
│   │   ├── ci.yml          # Lint, test, build
│   │   ├── e2e.yml         # Playwright E2E tests
│   │   ├── lighthouse.yml  # Performance audits
│   │   ├── release.yml     # Auto-release
│   │   ├── deploy-*.yml    # Vercel deployments
│   └── dependabot.yml      # Auto dependency updates
├── e2e/                    # Playwright E2E tests
├── __tests__/              # Jest unit tests
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Auth routes
│   │   ├── anime/          # Anime pages
│   │   ├── komik/          # Komik pages
│   │   ├── bookmark/       # Bookmark page
│   │   ├── history/        # History page
│   │   └── api/            # API routes
│   ├── components/
│   │   ├── layout/         # Navbar, Footer, Sidebar
│   │   ├── ui/             # Reusable UI components
│   │   └── providers/      # Context providers
│   ├── lib/                # Utilities & API client
│   ├── stores/             # Zustand stores
│   ├── types/              # TypeScript types
│   └── hooks/              # Custom React hooks
├── Dockerfile              # Production Docker image
├── docker-compose.yml      # Production compose
└── docker-compose.dev.yml  # Development compose
```

---

## 🧪 Testing

```bash
# Unit tests
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report

# E2E tests (Playwright)
npm run test:e2e            # Run E2E tests
npm run test:e2e:ui         # With UI mode
npm run test:e2e:headed     # With browser visible
npm run test:e2e:report     # View last report
```

---

## 📊 CI/CD Pipeline

Pipeline otomatis yang berjalan di setiap push/PR:

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **CI** | Push, PR | Lint, TypeScript, Unit Tests, Build, Security |
| **E2E** | Push, PR | Playwright tests (Chrome, Firefox, Mobile) |
| **Lighthouse** | Push, PR | Performance, Accessibility, SEO audits |
| **Deploy Preview** | PR | Deploy preview ke Vercel |
| **Deploy Production** | Push to main | Deploy ke production |
| **Deploy Staging** | Push to staging | Deploy ke staging environment |
| **Release** | Push to main | Auto-versioning & changelog |

### Required Secrets

Setup secrets di GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `CODECOV_TOKEN` | (Optional) Codecov token |

---

## 🔌 API Endpoints

### External (Sansekai API)

#### Komik
- `GET /komik/recommended?type={manhwa|manhua|manga}` - Rekomendasi
- `GET /komik/latest?type={project|mirror}` - Terbaru
- `GET /komik/search?query={query}` - Pencarian
- `GET /komik/popular?page={page}` - Populer
- `GET /komik/detail?manga_id={id}` - Detail
- `GET /komik/chapterlist?manga_id={id}` - Daftar chapter
- `GET /komik/getimage?chapter_id={id}` - Gambar chapter

#### Anime
- `GET /anime/latest` - Terbaru
- `GET /anime/recommended?page={page}` - Rekomendasi
- `GET /anime/search?query={query}` - Pencarian
- `GET /anime/detail?urlId={id}` - Detail
- `GET /anime/movie` - List movie
- `GET /anime/getvideo?chapterUrlId={id}&reso={resolution}` - Streaming

### Internal (App API)

- `GET/POST/DELETE /api/bookmarks` - Manage bookmarks
- `GET/POST/DELETE /api/history` - Manage history
- `GET /api/health` - Health check (for Docker/monitoring)
- `POST /api/webhooks/clerk` - Clerk webhooks

---

## 📝 Environment Variables

```env
# Database (Optional - for user sync)
DATABASE_URL="postgresql://..."

# Clerk Authentication (Optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Clerk URLs (optional)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# API
NEXT_PUBLIC_API_URL="https://api.sansekai.my.id/api"

# Build (CI only)
SKIP_DB_CONNECTION="true"
```

---

## 🎨 Features Breakdown

### Animations
- Hero section fade-in animations
- Card hover lift effects
- Staggered grid animations
- Page transition effects
- Scroll-triggered animations

### TanStack Query Hooks
- `useKomikLatest()` - Fetch latest komik
- `useKomikPopular(page)` - Fetch popular with pagination
- `useKomikSearch(query)` - Search komik
- `useAnimeLatest()` - Fetch latest anime
- `useAnimeRecommended(page)` - Fetch recommended anime
- ... and more!

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Docker

```bash
# Build image
docker build -t komikstream .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..." \
  -e CLERK_SECRET_KEY="..." \
  KuroManga
```

### Manual

```bash
npm run build
npm start
```

---

## 📈 Monitoring (Optional)

### Production Architecture

KuroManga uses a **dual-environment architecture** for optimal performance and reliability:

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                             │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Worker (Edge Proxy)                     │
│  • Global edge locations (low latency)                          │
│  • L1 Cache: CF Cache API (5-15 min TTL)                        │
│  • API Proxy: Bypasses origin IP blocks                         │
│  • Analytics: CF Analytics Engine                               │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               Azure App Service (Origin)                        │
│  • Next.js SSR with full Node.js runtime                        │
│  • L2 Cache: PostgreSQL (Supabase) with TTL                     │
│  • L3: External API (sankavollerei.com)                         │
│  • L4: Stale fallback (expired DB cache)                        │
│  • Observability: Azure Application Insights                    │
└─────────────────────────────────────────────────────────────────┘
```

**Caching tiers:**
| Tier | Location | TTL | Purpose |
|------|----------|-----|---------|
| L1 | CF Cache API | 5-15 min | Edge caching, reduces origin load |
| L2 | PostgreSQL | 30 min | DB cache with structured data |
| L3 | External API | ISR | Fresh data from source |
| L4 | Stale DB | ∞ | Fallback when API is blocked/down |

### Azure Application Insights

The app tracks comprehensive metrics via Azure App Insights:

**Events tracked:**
- `cache_hit` / `cache_miss` / `cache_stale` — Per-tier cache performance
- `api_success` / `api_error` / `api_retry` / `api_timeout` — External API health
- `rate_limit_hit` — 429 responses from external API
- `db_error` — Database connection/query failures

**KQL Queries for App Insights:**

```kusto
// Cache hit rate by tier (last 24h)
customEvents
| where timestamp > ago(24h)
| where name in ("cache_hit", "cache_miss", "cache_stale")
| summarize count() by name, tostring(customDimensions.cacheTier)
| render piechart

// API latency percentiles (last 1h)
customMetrics
| where timestamp > ago(1h)
| where name endswith "_duration_ms"
| summarize 
    p50=percentile(value, 50),
    p95=percentile(value, 95),
    p99=percentile(value, 99)
  by name
| order by p95 desc

// External API error rate (last 6h)
customEvents
| where timestamp > ago(6h)
| where name in ("api_success", "api_error", "api_timeout", "rate_limit_hit")
| summarize count() by name, bin(timestamp, 15m)
| render timechart

// Stale fallback usage (indicates API issues)
customEvents
| where timestamp > ago(24h)
| where name == "cache_stale"
| summarize count() by tostring(customDimensions.contentType), bin(timestamp, 1h)
| render timechart

// Slowest endpoints (last 1h)
customEvents
| where timestamp > ago(1h)
| where name == "api_success"
| extend durationMs = toint(customMeasurements.durationMs)
| summarize avg(durationMs), max(durationMs), count() by tostring(customDimensions.context)
| order by avg_durationMs desc
| take 10
```

**Recommended Alerts:**

| Alert | Condition | Severity |
|-------|-----------|----------|
| High API error rate | `api_error` count > 50 in 15 min | Warning |
| Stale fallback spike | `cache_stale` count > 20 in 15 min | Warning |
| Rate limiting | `rate_limit_hit` count > 10 in 5 min | Critical |
| Slow API response | P95 latency > 3000ms | Warning |

### UptimeRobot Setup

1. Buat akun di [UptimeRobot](https://uptimerobot.com) (free)
2. Add new monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://your-domain.vercel.app/api/health`
   - Monitoring Interval: 5 minutes
3. Setup alert contacts (email/Telegram/Slack)

### Health Check Endpoint

```bash
curl https://your-domain.vercel.app/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67,
  "version": "0.1.0",
  "checks": {
    "database": "connected",
    "api": "operational"
  },
  "responseTime": "5ms"
}
```

---

## 📜 License

MIT License - feel free to use for personal projects.

---

## 🙏 Credits

- API by [Sansekai](https://api.sansekai.my.id/)
- Icons by [Lucide](https://lucide.dev/)
- Fonts by [Vercel](https://vercel.com/font)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance
