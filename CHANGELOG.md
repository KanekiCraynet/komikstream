# Changelog

All notable changes to this project will be documented in this file.

## [0.35.27] - 2026-04-06

### Bug Fixes
- fix(ci): pass secrets to reusable ci.yml workflow via secrets: inherit (40c9061)


## [0.35.26] - 2026-04-06

### Bug Fixes
- fix(ci): add Neon DB for tests, fix Next.js 16 middleware/ISR deprecations (b6a0855)


## [0.35.25] - 2026-04-06

### Bug Fixes
- fix(config): disable ISR filesystem writes to avoid ENOENT on read-only wwwroot (3470137)


## [0.35.24] - 2026-04-06

### Bug Fixes
- fix(worker): don't cache 403 responses, update User-Agent to Chrome 136 (184b74b)

### Other Changes
- Revert "fix(deploy): use pnpm node-linker=node-modules to eliminate all symlink issues" (feb1dbf)


## [0.35.23] - 2026-04-06

### Bug Fixes
- fix(deploy): use pnpm node-linker=node-modules to eliminate all symlink issues (698227f)


## [0.35.22] - 2026-04-06

### Bug Fixes
- fix(deploy): include postgres-* store entries to resolve xtend cascade (3a940b7)


## [0.35.21] - 2026-04-06

### Bug Fixes
- fix(deploy): copy entire pg store tree to resolve postgres-array cascade (8ad9b95)


## [0.35.20] - 2026-04-06

### Bug Fixes
- fix(deploy): copy pg-types and pg-protocol from pnpm store explicitly (8701d16)


## [0.35.19] - 2026-04-06

### Bug Fixes
- fix(deploy): restore explicit pnpm-store copies for .prisma/client and @prisma/* (40e5686)


## [0.35.18] - 2026-04-06

### Bug Fixes
- fix(deploy): resolve ALL pnpm symlinks universally instead of per-package (bc0fd0e)


## [0.35.17] - 2026-04-06

### Bug Fixes
- fix(deploy): resolve pnpm symlinks for all @prisma/* sub-packages (742817d)


## [0.35.16] - 2026-04-06

### Bug Fixes
- fix(azure): include all @prisma/* packages in standalone output trace (7095f6e)
- fix(infra): fix health check, CI/CD double-deploy, Docker, and CF Worker issues (d52503c)


## [0.35.15] - 2026-04-06

### Bug Fixes
- fix(deploy): fix pnpm Prisma symlink issue and use dummy DATABASE_URL during build (82d395e)


## [0.35.14] - 2026-04-05

### Bug Fixes
- fix(azure): include .prisma/client and pg deps in standalone output trace (ffd8edf)


## [0.35.13] - 2026-04-05

### Bug Fixes
- fix(build): resolve useContext null error during SSG prerendering (ae0e6a7)


## [0.35.12] - 2026-04-05

### Bug Fixes
- fix(build): use webpack for all builds (6928495)


## [0.35.11] - 2026-04-05

### Bug Fixes
- fix(azure): include react/react-dom in standalone output trace (4a9be41)


## [0.35.10] - 2026-04-05

### Bug Fixes
- fix(deploy): use Kudu ZipDeploy API instead of OneDeploy (1d710d7)


## [0.35.9] - 2026-04-05

### Bug Fixes
- fix(azure): add @next/env as explicit dependency for standalone build (af55269)


## [0.35.8] - 2026-04-05

### Bug Fixes
- fix(azure): add @swc/helpers as explicit dependency for standalone build (ac6c9b8)


## [0.35.7] - 2026-04-05

### Bug Fixes
- fix(deps): add styled-jsx as explicit dependency for standalone build (6dc9ccc)

### CI/CD
- ci(azure): increase deployment timeout to 30 minutes (5bd86c0)


## [0.35.6] - 2026-04-05

### Bug Fixes
- fix(build): move outputFileTracingIncludes to top-level config (48ac8fb)


## [0.35.5] - 2026-04-05

### Bug Fixes
- fix(build): include styled-jsx in standalone output tracing (c3f2340)


## [0.35.4] - 2026-04-05

### Bug Fixes
- fix(build): add webpackIgnore to dynamic imports in analytics.ts (a154735)


## [0.35.3] - 2026-04-04

### Bug Fixes
- fix(build): replace applicationinsights type import with inline interface (4c35cfb)


## [0.35.2] - 2026-04-04

### Bug Fixes
- fix(deploy): use webpack for production builds instead of Turbopack (5576ff8)


## [0.35.1] - 2026-04-04

### Bug Fixes
- fix(ci): remove extra '--' from pnpm test command (a5cdd0b)


## [0.35.0] - 2026-04-04

### Features
- feat(anime): add status filter and rating sort support (3eda900)

### Bug Fixes
- fix(ci): add packageManager field for pnpm version detection (5749f81)

### CI/CD
- ci: migrate all workflows from npm to pnpm (497e315)

### Chores
- chore: cleanup duplicate routes and unused files (28d0f70)
- chore: remove dead code and temporary design files (90a75ad)
- chore(deps): bump effect in the npm_and_yarn group across 1 directory (9fd58c2)


## [0.34.1] - 2026-04-04

### Bug Fixes
- fix(analytics): remove server-only import causing client component build failure (ea62043)


## [0.34.0] - 2026-04-04

### Features
- feat(observability): add dual-mode analytics for Azure App Insights and CF Workers (459d5b3)

### Other Changes
- style: fix prettier formatting (82aa5a5)


## [0.33.2] - 2026-04-04

### Refactoring
- refactor(api): split monolithic api-client.ts into modular structure (65db8ee)


## [0.33.1] - 2026-04-03

### Refactoring
- refactor(listing): add modular listing components and improve page clients (884236c)


## [0.33.1] - 2026-04-04

### Features
- feat: redesign /komik and /anime listing pages with app-like mobile-first design
  - Add FeaturedSpotlight component with auto-rotate (8s), swipe gestures, and dot indicators
  - Add StickyFilterBar component with glassmorphism, hide on scroll down/show on scroll up
  - Add DiscoveryPanel component with trending list, realtime stats, and quick access links
  - Add RecommendationRow component with horizontal scroll and fade gradients
  - Add useScrollDirection hook for scroll behavior detection
  - Add useListingStats hooks (useKomikStats, useAnimeStats) for deriving stats from API
  - Add formatNumber utility for displaying stats like "12.5K"
  - Komik page: amber/orange accent colors
  - Anime page: blue/indigo accent colors
  - Both pages: dark slate-950 background, sidebar layout, page-based pagination


## [0.33.0] - 2026-04-03

### Features
- feat(homepage): improve sidebar, genre filter, and completed section (fe56c4b)

### Tests
- test: add tests for HeroCarousel, CategoryFilter, and HomeSidebar (af5288d)


## [0.32.0] - 2026-04-03

### Features
- feat: redesign homepage with MihariNovel-inspired UI and SEO-friendly URLs (4b60025)


## [0.31.14] - 2026-04-01

### Bug Fixes
- fix: reject UUID mangaIds and clean stale bookmark/history records (03f9f89)


## [0.31.13] - 2026-04-01

### Bug Fixes
- fix: proxy API calls through CF Worker to bypass Plana AI Detector (881b25b)


## [0.31.12] - 2026-04-01

### Bug Fixes
- fix: broken anime stream URLs and missing manga chapters (d1f5bba)


## [0.31.11] - 2026-04-01

### Bug Fixes
- fix(build): respect SKIP_DB_CONNECTION in isDatabaseConfigured() (1030e20)


## [0.31.10] - 2026-04-01

### Bug Fixes
- fix(ci): skip direct Azure health polling due to IP restrictions (8dc877e)


## [0.31.9] - 2026-04-01

### Bug Fixes
- fix(ci): add HTTP headers to bypass Cloudflare bot protection (52ab82e)


## [0.31.8] - 2026-04-01

### Bug Fixes
- fix(build): prevent API rate-limit crashes during SSG pre-rendering (2bf8ac2)


## [0.31.7] - 2026-04-01

### Bug Fixes
- fix: resolve multiple production data loading failures (87425aa)


## [0.31.6] - 2026-04-01

### Bug Fixes
- fix(ci): skip direct Azure health polling due to IP restrictions (2360017)

### Other Changes
- style: fix prettier formatting in inject-sw-version script (e6a788f)


## [0.31.5] - 2026-04-01

### Bug Fixes
- fix: resolve remaining ESLint warnings in test setup and worker (bda870f)


## [0.31.4] - 2026-04-01

### Bug Fixes
- fix: resolve ESLint unused variable warnings (8fa4422)


## [0.31.3] - 2026-04-01

### Performance
- perf: optimize API endpoints and CI/CD workflow (9ea8f3b)

### Chores
- chore: error boundaries, SW versioning, and misc improvements (2ea6891)


## [0.31.2] - 2026-03-31

### Bug Fixes
- fix: broken komik URLs and thumbnail display (aad7aa2)


## [0.31.1] - 2026-03-31

### Bug Fixes
- fix: correct API endpoints and field mappings in seed script (ff62fed)


## [0.31.0] - 2026-03-31

### Features
- feat: add bulk seed endpoint and script for Azure DB population (fbd1ca6)

### Bug Fixes
- fix: resolve TypeScript errors in seed script filter chains (d8be858)


## [0.30.0] - 2026-03-31

### Features
- feat: add temporary migration endpoint for Azure PostgreSQL (2525418)


## [0.29.5] - 2026-03-31

### Bug Fixes
- fix: add stale-on-error DB fallback to prevent 404 on detail pages (bfa1622)


## [0.29.4] - 2026-03-31

### Bug Fixes
- fix: use full browser fingerprint headers for external API health check (56ddcfa)

### Other Changes
- debug: add externalApiDebug field to health response (43b7409)


## [0.29.3] - 2026-03-31

### Bug Fixes
- fix: add logging to health check external API for debugging degraded status (894622e)


## [0.29.2] - 2026-03-31

### Bug Fixes
- fix: health check uses browser-like headers for external API (a005cea)


## [0.29.1] - 2026-03-30

### Bug Fixes
- fix: route workflows through CF Worker (Azure has IP restriction) (3745426)


## [0.29.0] - 2026-03-30

### Features
- feat: comprehensive production optimization (KV budget, security, performance) (910f742)


## [0.28.0] - 2026-03-27

### Features
- feat: comprehensive SEO optimization for better search rankings (d5f420f)


## [0.27.5] - 2026-03-27

### Bug Fixes
- fix: add otakudesu.blog to CDN proxy & improve sitemap for GSC (e0d22ae)


## [0.27.4] - 2026-03-27

### Bug Fixes
- fix: proxy CDN images through /cdn/ to bypass ISP blocking & fix sitemap 404 (87313e5)


## [0.27.3] - 2026-03-27

### Bug Fixes
- fix: route cache-warm cron through Cloudflare domain (b7a7704)


## [0.27.2] - 2026-03-27

### Bug Fixes
- fix: inline query keys in homepage to avoid "use client" import during build (89f158b)


## [0.27.1] - 2026-03-27

### Bug Fixes
- fix: extract makeQueryClient to server-safe module (c142fdf)

### Other Changes
- style: format public/offline.html and public/sw.js with prettier (f5c82b1)


## [0.27.0] - 2026-03-27

### Features
- feat: comprehensive SEO audit & optimization (7c19c39)


## [0.26.7] - 2026-03-26

### Bug Fixes
- fix: sitemap id type mismatch — Next.js passes string, not number (65f90cb)


## [0.26.6] - 2026-03-26

### Bug Fixes
- fix: update Button test for 44px icon touch target (b77626b)

### Chores
- chore(deps-dev): bump picomatch (1905553)


## [0.26.5] - 2026-03-26

### Bug Fixes
- fix: mobile UI bugs + SEO optimization for traffic growth (26a706a)


## [0.26.4] - 2026-03-26

### Bug Fixes
- fix: skip KV cache for RSC prefetch requests (c9e27d8)


## [0.26.3] - 2026-03-26

### Bug Fixes
- fix: update azure/webapps-deploy to v3.0.8 (valid SHA) (c9adc4d)


## [0.26.2] - 2026-03-26

### Bug Fixes
- fix: add try/catch to API calls for build-time resilience (dbf5383)


## [0.26.1] - 2026-03-26

### Bug Fixes
- fix: prettier formatting for wrangler.jsonc and SearchBar test role (e967350)

### Chores
- chore: cleanup OpenNext artifacts and update cache-warm URL (e4fe8d3)


## [0.26.0] - 2026-03-26

### Features
- feat: add Azure App Service deployment with CF Worker edge proxy (233b802)
- feat: add anime/komik pages, KV caching, rate limiting, and analytics (1768dd2)

### Bug Fixes
- fix: exclude workers dir from root tsconfig typecheck (9f249ef)


## [0.25.0] - 2026-03-25

### Features
- feat: add GlobalError component for improved error handling (ae462cc)


## [0.24.1] - 2026-03-25

### Bug Fixes
- fix(ui): update button opacity and search input type for better UX (21a1665)


## [0.24.0] - 2026-03-25

### Features
- feat: add proxy URL for Clerk integration in middleware and environment configuration (6dd7b5e)


## [0.23.1] - 2026-03-25

### Bug Fixes
- fix(middleware): update Clerk middleware to use lazy getters for secret keys (70adbf8)


## [0.23.0] - 2026-03-25

### Features
- feat(middleware): implement Clerk middleware for route protection and public API handling (a9ef812)


## [0.22.0] - 2026-03-25

### Features
- feat: enhance error handling and improve API request headers (8dfec7f)


## [0.21.0] - 2026-03-25

### Features
- feat(middleware): add Clerk middleware for route protection and public API handling (24e5fa1)


## [0.20.5] - 2026-03-24

### Bug Fixes
- fix(api): update API URL references to sankavollerei.com (68b0dcd)


## [0.20.4] - 2026-03-24

### Bug Fixes
- fix(api): update API URL references to sankavollerei.com (26c5e40)

### Chores
- chore(api): add diagnostic error details to search and video API routes (5e3b259)


## [0.20.3] - 2026-03-24

### Bug Fixes
- fix(prisma): restore edge client and break toxic import chain for CF Workers (eba2063)

### Chores
- chore(deps): bump the npm_and_yarn group across 1 directory with 2 updates (dc5ce96)


## [0.20.2] - 2026-03-21

### Refactoring
- refactor(prisma): update Prisma client configuration for Cloudflare Workers compatibility (d24e283)

### Chores
- chore(deps): bump undici in the npm_and_yarn group across 1 directory (157b77d)


## [0.20.1] - 2026-03-19

### Bug Fixes
- fix(layout): add polyfill for esbuild's __name() to prevent hydration errors (0982621)


## [0.20.0] - 2026-03-19

### Features
- feat(deploy): update staging deployment to Cloudflare Workers and enhance workflow steps refactor(lighthouse): remove unused environment variables fix(csp): add Cloudflare Web Analytics script to CSP directives chore(auth): explicitly pass publishableKey to ClerkProvider to avoid keyless mode refactor(provider): remove unused ClerkProviderWrapper component chore(wrangler): add public runtime variables for Clerk and API URLs (96760d2)


## [0.19.9] - 2026-03-18

### Bug Fixes
- fix(api-client): remove cache-config dependency and update fetch options for Cloudflare Workers compatibility (18952e9)

### Chores
- chore(deps): bump next in the npm_and_yarn group across 1 directory (3761c16)


## [0.19.8] - 2026-03-18

### Bug Fixes
- fix(api-client): remove next:{revalidate} and AbortController from fetch (fecf674)


## [0.19.7] - 2026-03-18

### Bug Fixes
- fix(api-client): remove server-only logger import that broke client bundling (6e1d02e)


## [0.19.6] - 2026-03-18

### Bug Fixes
- fix: remove unused CACHE_TAGS import and handle fetch failure in getKomikChapterList test (6cc7b28)
- fix: remove fetch tags to fix detail pages on Cloudflare Workers (82487b0)


## [0.19.5] - 2026-03-18

### Bug Fixes
- fix: set Worker runtime secrets via Cloudflare API instead of wrangler versions (c691958)


## [0.19.4] - 2026-03-18

### Bug Fixes
- fix: promote Worker version after setting runtime secrets (ccf8af5)


## [0.19.3] - 2026-03-18

### Bug Fixes
- fix: use wrangler versions secret put for Worker Versions API (4e40f03)


## [0.19.2] - 2026-03-18

### Bug Fixes
- fix: push runtime secrets to Cloudflare Worker after deploy (6bd8bd4)


## [0.19.1] - 2026-03-18

### Bug Fixes
- fix: rename proxy.ts back to middleware.ts for OpenNext compatibility (a68eed9)


## [0.19.0] - 2026-03-18

### Features
- feat: migrate CI/CD workflows from Vercel to Cloudflare Workers and optimize Prisma for edge deployment (e349767)
- feat: implement middleware for Clerk authentication and define route matchers (3e2644c)
- feat: migrate from Vercel to Cloudflare Workers via OpenNext (3486afb)

### Bug Fixes
- fix: add @testing-library/dom as explicit devDependency (7669e0b)


## [0.18.0] - 2026-03-12

### Features
- feat: implement Suspense for async content loading and add skeleton components in Anime and Komik detail pages (a5c64e0)


## [0.17.0] - 2026-03-12

### Features
- feat: implement loading skeletons and improve search functionality in Komik pages (b30cffa)


## [0.16.1] - 2026-03-11

### Bug Fixes
- fix(Card): enable unoptimized image loading for better performance (0acbe5d)


## [0.16.0] - 2026-03-11

### Features
- feat(middleware): add health check route to public API routes (efa33a1)

### Bug Fixes
- fix(release): improve changelog entry insertion logic (2b84180)


## [0.15.0] - 2026-03-11

### Features
- feat(e2e): enhance page navigation handling and add health check in workflows (45eaf80)

### Tests
- test: enhance page load handling in e2e tests for improved reliability (d05e18a)


## [0.14.0] - 2026-03-11

### Features
- feat(anime): update episode navigation and video player components for improved user experience (4ae0587)


## [0.13.4] - 2026-03-11

### Bug Fixes
- fix(anime): reverse episode order and video auto-download on desktop (d82b488)


## [0.13.3] - 2026-03-10

### Bug Fixes
- fix(deploy): remove pnpm-lock.yaml causing Vercel to use pnpm (d97c68a)


## [0.13.2] - 2026-03-10

### Bug Fixes
- fix(deps): regenerate package-lock.json for npm overrides (45da206)


## [0.13.1] - 2026-03-10

### Bug Fixes
- fix: reverse chapter navigation, image error handling, and CI/CD improvements (5cff1a7)


## [0.13.0] - 2026-03-05

### Performance
- perf: fix LCP by removing framer-motion from critical path and enabling image optimization (0df29a4)


## [0.12.0] - 2026-03-05

### Bug Fixes
- fix(security): patch 9 Dependabot vulnerabilities via pnpm overrides (6fb1570)


## [0.11.0] - 2026-03-05

### Features
- feat: rebrand to KuroManga, improve UI/UX and SEO (ff48c75)


## [0.10.9] - 2026-03-05

### Bug Fixes
- fix: remove unused screen import in Skeleton test (34b3689)


## [0.10.8] - 2026-03-05

### Bug Fixes
- fix: gracefully handle API 403 errors in cached detail endpoints (a4b3312)


## [0.10.7] - 2026-03-05

### Bug Fixes
- fix: harden Neon DB connection — increase timeout to 10s, fix pg SSL warning (a63ddf6)


## [0.10.6] - 2026-03-05

### Bug Fixes
- fix: use AuthContext bridge instead of direct Clerk useAuth import (d23aefd)


## [0.10.5] - 2026-03-04

### Bug Fixes
- fix: add error handling to homepage sections for prerender resilience (62eba07)


## [0.10.4] - 2026-03-04

### Bug Fixes
- fix: resolve useAuth outside ClerkProvider and fix provider ordering (c0c0523)


## [0.10.3] - 2026-03-04

### Bug Fixes
- fix: add Clerk production domain to CSP script-src and connect-src (2277581)


## [0.10.2] - 2026-03-04

### Bug Fixes
- fix(ci): add --token flag to Vercel CLI commands in deploy workflows (16f6b89)


## [0.10.1] - 2026-03-04

### Bug Fixes
- fix(ci): resolve Gitleaks artifact name conflict in deploy-production (883de9e)

### CI/CD
- ci: comprehensive CI/CD audit fixes (Critical→Low priority) (cca48d1)


## [0.10.0] - 2026-03-04

### Other Changes
- ci: lower coverage thresholds to 10% after WP1-WP7 source expansion (8ece4c2)



## [0.9.0] - 2026-03-04

### Other Changes
- style: fix docker-compose.yml formatting (52f51ef)



## [0.8.0] - 2026-03-04

### Features
- feat: implement WP1-WP7 comprehensive code quality improvements (c3ddb93)



## [0.7.12] - 2026-03-03

### Bug Fixes
- fix(ci): make health check non-blocking and increase retry delays (5001785)



## [0.7.11] - 2026-03-03

### Bug Fixes
- fix(ci): accept 2xx-3xx in health check and add curl timeout (f8a780b)



## [0.7.10] - 2026-03-03

### Bug Fixes
- fix(ci): follow redirects in health check curl requests (6defa78)

### Other Changes
- style: format Prisma schema to pass CI formatting check (59f0bbf)
- ci: harden CI/CD pipeline with SHA pins, permissions, timeouts, and DRY refactors (f7125b0)



## [0.7.9] - 2026-03-03

### 📦 Other Changes
- test: add 65 new tests and raise coverage threshold to 20% (Phase D) (bad6fd2)



## [0.7.8] - 2026-03-03

### 📦 Other Changes
- chore: fix npm audit vulnerabilities and remove unused zod dependency (Phase E) (32235a0)



## [0.7.7] - 2026-03-03

### 📦 Other Changes
- refactor: remove dead code, extract shared components, improve accessibility (Phase C) (c079dc9)



## [0.7.6] - 2026-03-03

### 📦 Other Changes
- improve: error handling and resilience (Phase B) (269a5a7)



## [0.7.5] - 2026-03-03

### 📦 Other Changes
- improve: accessibility and code quality quick wins (Phase A) (081d2bd)



## [0.7.4] - 2026-03-03

### 🐛 Bug Fixes
- fix(ci): update auth-config tests for secret key validation and add gitleaks allowlist (7a6a4bf)



## [0.7.3] - 2026-03-03

### 🐛 Bug Fixes
- fix: resolve critical bugs and improve code quality (Phase 1 & 2) (8fe9cdf)



## [0.7.2] - 2026-02-10

### 📦 Other Changes
- update (d446cdb)



## [0.7.1] - 2026-02-10

### 🐛 Bug Fixes
- fix: update visibility check in local storage test to use HTML element (40b6091)



## [0.7.0] - 2026-02-10

### 🐛 Bug Fixes
- fix: update project name in package.json to 'KuroManga' (68f87fb)



## [0.6.0] - 2026-02-09

### ✨ Features
- feat: add manifest, robots, and sitemap routes for SEO and PWA support (926732c)

### 🐛 Bug Fixes
- fix: add missing scripts section in package.json (00cbb0f)



## [0.5.1] - 2026-02-09

### 🐛 Bug Fixes
- fix: update health check URL and increase retry parameters in deployment workflow (e5c6eab)



## [0.5.0] - 2026-02-09

### 🐛 Bug Fixes
- fix: change default value of skip_tests input to boolean type in deploy workflow (98f6fee)
- fix: standardize node-version-file quotes in CI workflows (6bea1c4)



## [0.4.0] - 2026-02-09

### ✨ Features
- feat: update CI/CD workflows and add security headers (e157dc6)



## [0.3.6] - 2026-02-09

### 🐛 Bug Fixes
- fix: remove transform settings from Jest configuration (daddc22)



## [0.3.5] - 2026-02-08

### 🐛 Bug Fixes
- fix: resolve merge conflict in package-lock.json (ab5a78e)
- fix: re-add @tailwindcss/postcss required by postcss config (5b4f0a7)
- fix: update search API to use api-client, add prisma fallback for build (02f78e5)
- fix: revert homepage to simpler approach using HomePageClient (d1e094a)
- fix: force dynamic rendering for homepage to avoid build-time API calls (52994c9)
- fix: correct TypeScript types for Next.js fetch options (b62f029)

### 📦 Other Changes
- perf: major performance optimization (7245430)



## [0.3.4] - 2026-02-08

### 🐛 Bug Fixes
- fix: remove directUrl from prisma.config.ts and fix unused vars in e2e tests (11848a5)



## [0.3.3] - 2026-02-08

### 🐛 Bug Fixes
- fix: remove prisma migrate deploy from vercel-build (0bf5626)



## [0.3.2] - 2026-02-07

### 🐛 Bug Fixes
- fix: database connection for Clerk webhook and API routes (ef0b79f)



## [0.3.1] - 2026-02-07

### 🐛 Bug Fixes
- fix(e2e): make tests more resilient for CI environment (faad06a)



## [0.3.0] - 2026-02-07

### 🐛 Bug Fixes
- fix(ci): add mock Prisma client for CI/build environments (bed8736)



## [0.2.0] - 2026-02-07

### ✨ Features
- feat(ci): add comprehensive CI/CD upgrade (f335b85)
- feat: initial commit with CI/CD setup (b4a05ff)

### 🐛 Bug Fixes
- fix(ci): fix release workflow for repos with few commits (7885088)
- fix(ci): lower coverage threshold to match current test coverage (f8af750)
- fix: resolve database connection pool exhaustion (b0c317e)
- fix: resolve ESLint warnings and add comprehensive tests (1cb3a00)
- fix: reject dummy/placeholder Clerk keys in auth-config and middleware (278dea1)
- fix: replace useState+useEffect with useSyncExternalStore for mounted state (865bf79)
- fix: add ts-node dependency for Jest TypeScript config (427472f)
- fix: add workflow_call trigger to ci.yml for reusable workflow (1a682aa)
- fix: replace any types with proper interfaces in api-client.ts and fix require import in db.ts (b85f0fd)
- fix: rename jest.setup.ts to jest.setup.tsx for JSX support (b4b9051)

### 📦 Other Changes
- style: format code with Prettier (3cfb91c)



