/**
 * Cloudflare Workers Free — Thin Edge Proxy
 *
 * Sits in front of Azure App Service as a lightweight gateway.
 * Responsibilities: trace ID, rate limiting, edge cache for public GET, proxy to origin.
 * Does NOT run Next.js — all rendering happens on Azure.
 *
 * Caching uses CF Cache API (caches.default), NOT KV.
 * Cache API is free with no write limits but is per-colo (not globally replicated).
 * This is acceptable for Indonesian audience (majority Jakarta/Singapore colos).
 *
 * Design limits (Workers Free):
 * - 100k requests/day (per account)
 * - 10ms CPU per invocation
 * - 50 subrequests per request
 */

// ─── Types ───────────────────────────────────────────────────────────

interface Env {
  RATE_LIMIT_KV: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
  WORKER_TOKEN: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const AZURE_ORIGIN = "https://kuromanga-eqh9frdqdzbjf9h4.indonesiacentral-01.azurewebsites.net";

/**
 * Whitelisted hostnames for the /cdn/ image proxy.
 * Only these origins are proxied to prevent open-relay abuse.
 */
const CDN_ALLOWED_HOSTS = new Set([
  "thumbnail.komiku.org",
  "img.komiku.org",
  "cdn.komiku.org",
  "otakudesu.blog",
]);

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  search: { maxRequests: 20, windowSeconds: 60 },
  video: { maxRequests: 60, windowSeconds: 60 },
};

const CACHE_TTLS: Record<string, number> = {
  html_listing: 300, // 5 min for homepage, listing, genre pages
  html_detail: 1800, // 30 min for detail pages (matches ISR revalidate)
  search: 30, // 30s for /api/search
};

// ─── Route Classification ────────────────────────────────────────────

const PRIVATE_PATTERNS = [
  /^\/api\/health$/,
  /^\/api\/internal(\/|$)/,
  /^\/api\/webhooks(\/|$)/,
  /^\/api\/bookmarks(\/|$)/,
  /^\/api\/history(\/|$)/,
  /^\/bookmark/,
  /^\/history/,
  /^\/sign-in/,
  /^\/sign-up/,
];

function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_PATTERNS.some((p) => p.test(pathname));
}

/**
 * Determine rate limit route key, or null if not rate-limited.
 */
function getRateLimitKey(pathname: string): string | null {
  if (pathname.startsWith("/api/search")) return "search";
  if (pathname.startsWith("/api/anime/video")) return "video";
  return null;
}

/**
 * Determine cache config for a cacheable route.
 * Returns null if the route should NOT be cached.
 *
 * /api/anime/video is explicitly excluded — embed URLs may be time-limited/signed.
 *
 * SWR (stale-while-revalidate) is set per content class rather than uniformly,
 * because different content types have different freshness requirements.
 */
function getCacheConfig(
  pathname: string,
  search: string,
  isRSC: boolean
): { ttl: number; swr: number; cacheUrl: string } | null {
  // RSC prefetch requests return a different payload — never cache them
  // to avoid serving RSC stream as HTML to regular browser requests.
  if (isRSC) return null;

  // Cache key is a full URL to satisfy CF Cache API requirements.
  // Using kuromanga.me as the hostname ensures cache keys are deterministic.
  const baseUrl = "https://kuromanga.me";

  if (pathname.startsWith("/api/search")) {
    return { ttl: CACHE_TTLS.search, swr: 5, cacheUrl: `${baseUrl}${pathname}${search}` };
  }
  // Detail pages: /anime/[id], /komik/[id] — longer TTL (matches ISR revalidate)
  const DETAIL_RE = /^\/(anime|komik)\/[^/]+$/;
  if (DETAIL_RE.test(pathname)) {
    return { ttl: CACHE_TTLS.html_detail, swr: 120, cacheUrl: `${baseUrl}${pathname}` };
  }
  // Chapter pages: /komik/[id]/[chapterId] — medium TTL
  const CHAPTER_RE = /^\/komik\/[^/]+\/[^/]+$/;
  if (CHAPTER_RE.test(pathname)) {
    return { ttl: 600, swr: 30, cacheUrl: `${baseUrl}${pathname}` };
  }
  // Genre/catalog pages — longer TTL, content changes infrequently
  const GENRE_RE = /^\/(anime|komik)\/(genre|berwarna|pustaka)/;
  if (GENRE_RE.test(pathname)) {
    return { ttl: 3600, swr: 300, cacheUrl: `${baseUrl}${pathname}` };
  }
  // Listing/homepage — shorter TTL (content changes frequently)
  if (pathname === "/" || pathname.startsWith("/anime") || pathname.startsWith("/komik")) {
    return { ttl: CACHE_TTLS.html_listing, swr: 30, cacheUrl: `${baseUrl}${pathname}` };
  }
  return null;
}

// ─── Analytics Helper ────────────────────────────────────────────────
// Best-effort event tracking via CF Analytics Engine (90-day retention).
// Schema: blob1=event_type, blob2=detail, blob3=extra; double1=value, double2=status; index1=event_type

function trackEvent(
  analytics: AnalyticsEngineDataset | undefined,
  event: string,
  detail: string = "",
  extra: string = "",
  value: number = 0,
  status: number = 0
): void {
  try {
    analytics?.writeDataPoint({
      blobs: [event, detail, extra],
      doubles: [value, status],
      indexes: [event],
    });
  } catch {
    // analytics is best-effort — never block request processing
  }
}

// ─── Rate Limiting (KV-backed, fixed window) ─────────────────────────
// Replicates src/lib/kv-rate-limit.ts logic. Key format: rl:{ip}:{routeKey}

async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  routeKey: string,
  config: RateLimitConfig,
  analytics?: AnalyticsEngineDataset
): Promise<{ allowed: boolean; resetAt: number }> {
  const key = `rl:${ip}:${routeKey}`;
  const now = Date.now();

  const existing = await kv.get<RateLimitEntry>(key, "json");

  if (!existing || now > existing.resetAt) {
    // New window — write to KV to establish the window
    const resetAt = now + config.windowSeconds * 1000;
    await kv.put(key, JSON.stringify({ count: 1, resetAt }), {
      expirationTtl: config.windowSeconds + 5,
    });
    trackEvent(analytics, "kv_write", "rate_limit_new_window", routeKey);
    return { allowed: true, resetAt };
  }

  // Within existing window — increment in-memory only.
  // KV is eventually consistent and not suitable for atomic counters.
  // We only write back when the limit is first exceeded, to persist
  // the rejection state for subsequent reads from other colos.
  // This reduces KV writes from 1/request to ~1/window.
  const newCount = existing.count + 1;
  const hitsLimit = newCount === config.maxRequests + 1;

  if (hitsLimit) {
    const ttlSeconds = Math.ceil((existing.resetAt - now) / 1000);
    if (ttlSeconds > 0) {
      await kv.put(key, JSON.stringify({ count: newCount, resetAt: existing.resetAt }), {
        expirationTtl: ttlSeconds,
      });
      trackEvent(analytics, "kv_write", "rate_limit_exceeded", routeKey);
    }
  }

  return { allowed: newCount <= config.maxRequests, resetAt: existing.resetAt };
}

// ─── Main Fetch Handler ──────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const traceId = crypto.randomUUID();

    try {
      return await handleRequest(request, env, ctx, traceId);
    } catch (err) {
      // Persist unhandled errors to Analytics Engine (90-day retention)
      const message = err instanceof Error ? err.message : String(err);
      const pathname = new URL(request.url).pathname;
      trackEvent(env.ANALYTICS, "worker_error", pathname, message, 0, 500);

      return new Response("Internal Server Error", {
        status: 500,
        headers: { "x-trace-id": traceId },
      });
    }
  },
};

async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  traceId: string
): Promise<Response> {
  const url = new URL(request.url);
  const { pathname, search } = url;
  const method = request.method;

  // ── 0. CDN image proxy (/cdn/{host}/{path}) ──
  // Proxies images from whitelisted upstream CDNs through our domain
  // to bypass Indonesian ISP DNS blocking of komiku.org domains.

  if (pathname.startsWith("/cdn/")) {
    const rest = pathname.slice(5); // strip "/cdn/"
    const slashIdx = rest.indexOf("/");
    if (slashIdx > 0) {
      const host = rest.slice(0, slashIdx);
      const path = rest.slice(slashIdx);
      if (CDN_ALLOWED_HOSTS.has(host)) {
        const originUrl = `https://${host}${path}${search}`;
        const imgResp = await fetch(originUrl, {
          headers: { Accept: request.headers.get("Accept") ?? "image/*" },
          cf: { cacheTtl: 86400, cacheEverything: true },
        });

        if (!imgResp.ok) {
          return new Response(null, { status: imgResp.status });
        }

        const headers = new Headers(imgResp.headers);
        headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800");
        headers.set("Access-Control-Allow-Origin", "*");
        headers.delete("Set-Cookie");
        return new Response(imgResp.body, { status: 200, headers });
      }
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── 0b. Block internal routes at the edge ──
  // /api/internal/* is restricted to authenticated callers (e.g. cache-warm cron).
  // Requests with valid Authorization header pass through to origin;
  // unauthenticated requests get 404 to prevent external probing.
  if (pathname.startsWith("/api/internal/")) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response("Not Found", { status: 404 });
    }
    // Authenticated — fall through to proxy (origin validates the token)
  }

  // ── 1. Rate limiting (runs before cache check) ──

  const rlRouteKey = getRateLimitKey(pathname);
  if (rlRouteKey) {
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for") ??
      "unknown";
    const config = RATE_LIMITS[rlRouteKey];

    try {
      const result = await checkRateLimit(env.RATE_LIMIT_KV, ip, rlRouteKey, config, env.ANALYTICS);

      if (!result.allowed) {
        trackEvent(env.ANALYTICS, "rate_limit_hit", rlRouteKey, ip, 0, 429);

        const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
        return new Response(
          JSON.stringify({
            error: "Too Many Requests",
            code: "RATE_LIMIT_EXCEEDED",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
              "X-RateLimit-Limit": String(config.maxRequests),
              "X-RateLimit-Remaining": "0",
              "x-trace-id": traceId,
            },
          }
        );
      }
    } catch {
      // KV error — let request through (fail open for availability)
    }
  }

  // ── 2. Edge cache check (CF Cache API, per-colo) ──
  // Uses caches.default instead of KV to avoid KV write budget exhaustion.
  // Cache API is free with no write limits. Per-colo only (not globally
  // replicated), which is acceptable for Indonesian audience.

  const isGet = method === "GET";
  const isRSC = request.headers.get("RSC") === "1";
  const isPublic = isGet && !isPrivateRoute(pathname);
  const cacheConfig = isPublic ? getCacheConfig(pathname, search, isRSC) : null;

  if (cacheConfig) {
    const cache = caches.default;
    const cacheKey = new Request(cacheConfig.cacheUrl, { method: "GET" });
    try {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const hitHeaders = new Headers(cached.headers);
        hitHeaders.set("x-cache", "HIT");
        hitHeaders.set("x-trace-id", traceId);
        return new Response(cached.body, {
          status: cached.status,
          headers: hitHeaders,
        });
      }
    } catch {
      // Cache read error — proceed to origin
    }
  }

  // ── 3. Proxy to Azure origin ──
  // NEVER fetch kuromanga.me — always use Azure hostname to avoid loop.

  const originUrl = new URL(url.toString());
  originUrl.hostname = new URL(AZURE_ORIGIN).hostname;
  originUrl.protocol = "https:";
  originUrl.port = "";

  const proxyHeaders = new Headers(request.headers);
  proxyHeaders.set("Host", new URL(AZURE_ORIGIN).hostname);
  proxyHeaders.set("X-Forwarded-Host", url.hostname); // kuromanga.me
  proxyHeaders.set("X-Forwarded-Proto", "https");
  proxyHeaders.set("x-trace-id", traceId);
  if (env.WORKER_TOKEN) {
    proxyHeaders.set("x-worker-token", env.WORKER_TOKEN);
  }
  // Cookies pass through automatically via headers copy

  const originResponse = await fetch(originUrl.toString(), {
    method,
    headers: proxyHeaders,
    body: isGet || method === "HEAD" ? undefined : request.body,
    redirect: "manual", // Don't follow redirects — pass them to client as-is
  });

  // ── 4. Cache eligible responses via CF Cache API (fire-and-forget) ──

  if (cacheConfig && originResponse.ok) {
    const hasSetCookie = originResponse.headers.has("Set-Cookie");
    const originCacheControl = originResponse.headers.get("Cache-Control") ?? "";
    const isPrivateResponse =
      originCacheControl.includes("private") || originCacheControl.includes("no-store");

    if (!hasSetCookie && !isPrivateResponse) {
      const cache = caches.default;
      const cacheKey = new Request(cacheConfig.cacheUrl, { method: "GET" });
      const cacheHeaders = new Headers(originResponse.headers);
      // Set Cache-Control with content-class-specific TTL and SWR
      cacheHeaders.set(
        "Cache-Control",
        `public, s-maxage=${cacheConfig.ttl}, stale-while-revalidate=${cacheConfig.swr}`
      );
      cacheHeaders.set("x-cache", "MISS");

      const clone = originResponse.clone();
      ctx.waitUntil(
        cache
          .put(
            cacheKey,
            new Response(clone.body, {
              status: clone.status,
              headers: cacheHeaders,
            })
          )
          .catch(() => {
            // Cache write failure — non-blocking
          })
      );
    }
  }

  // ── 5. Return response with trace/cache/SEO headers ──

  const responseHeaders = new Headers(originResponse.headers);
  responseHeaders.set("x-trace-id", traceId);
  if (cacheConfig) {
    responseHeaders.set("x-cache", "MISS");
    responseHeaders.set(
      "Cache-Control",
      `public, max-age=${cacheConfig.ttl}, stale-while-revalidate=${cacheConfig.swr}`
    );
  }

  // SEO/performance: add Link preconnect header for API domain
  // so browsers can start DNS+TLS handshake early for client-side fetches
  const contentType = responseHeaders.get("Content-Type") ?? "";
  if (contentType.includes("text/html")) {
    responseHeaders.set(
      "Link",
      '</cdn/>; rel="preconnect", <https://www.sankavollerei.com>; rel="preconnect"; crossorigin'
    );
  }

  return new Response(originResponse.body, {
    status: originResponse.status,
    statusText: originResponse.statusText,
    headers: responseHeaders,
  });
}
