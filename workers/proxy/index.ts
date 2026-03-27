/**
 * Cloudflare Workers Free — Thin Edge Proxy
 *
 * Sits in front of Azure App Service as a lightweight gateway.
 * Responsibilities: trace ID, rate limiting, KV cache for public GET, proxy to origin.
 * Does NOT run Next.js — all rendering happens on Azure.
 *
 * Design limits (Workers Free):
 * - 100k requests/day
 * - 10ms CPU per invocation
 * - 50 subrequests per request
 */

// ─── Types ───────────────────────────────────────────────────────────

interface Env {
  RATE_LIMIT_KV: KVNamespace;
  API_CACHE_KV: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface CachedResponse {
  body: string;
  contentType: string;
  status: number;
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
 */
function getCacheConfig(
  pathname: string,
  search: string,
  isRSC: boolean
): { ttl: number; key: string } | null {
  // RSC prefetch requests return a different payload — never cache them
  // to avoid serving RSC stream as HTML to regular browser requests.
  if (isRSC) return null;

  if (pathname.startsWith("/api/search")) {
    return { ttl: CACHE_TTLS.search, key: `search:${pathname}${search}` };
  }
  // Detail pages: /anime/[id], /komik/[id] — longer TTL (matches ISR revalidate)
  const DETAIL_RE = /^\/(anime|komik)\/[^/]+$/;
  if (DETAIL_RE.test(pathname)) {
    return { ttl: CACHE_TTLS.html_detail, key: `html:${pathname}` };
  }
  // Listing/genre/homepage — shorter TTL (content changes frequently)
  if (pathname === "/" || pathname.startsWith("/anime") || pathname.startsWith("/komik")) {
    return { ttl: CACHE_TTLS.html_listing, key: `html:${pathname}` };
  }
  return null;
}

// ─── Rate Limiting (KV-backed, fixed window) ─────────────────────────
// Replicates src/lib/kv-rate-limit.ts logic. Key format: rl:{ip}:{routeKey}

async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  routeKey: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; resetAt: number }> {
  const key = `rl:${ip}:${routeKey}`;
  const now = Date.now();

  const existing = await kv.get<RateLimitEntry>(key, "json");

  if (!existing || now > existing.resetAt) {
    const resetAt = now + config.windowSeconds * 1000;
    await kv.put(key, JSON.stringify({ count: 1, resetAt }), {
      expirationTtl: config.windowSeconds + 5,
    });
    return { allowed: true, resetAt };
  }

  const newCount = existing.count + 1;
  const ttlSeconds = Math.ceil((existing.resetAt - now) / 1000);

  if (ttlSeconds > 0) {
    await kv.put(key, JSON.stringify({ count: newCount, resetAt: existing.resetAt }), {
      expirationTtl: ttlSeconds,
    });
  }

  return { allowed: newCount <= config.maxRequests, resetAt: existing.resetAt };
}

// ─── Main Fetch Handler ──────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, search } = url;
    const method = request.method;
    const traceId = crypto.randomUUID();

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

    // ── 1. Rate limiting (runs before cache check) ──

    const rlRouteKey = getRateLimitKey(pathname);
    if (rlRouteKey) {
      const ip =
        request.headers.get("cf-connecting-ip") ??
        request.headers.get("x-forwarded-for") ??
        "unknown";
      const config = RATE_LIMITS[rlRouteKey];

      try {
        const result = await checkRateLimit(env.RATE_LIMIT_KV, ip, rlRouteKey, config);

        if (!result.allowed) {
          // Fire analytics event (fire-and-forget)
          try {
            env.ANALYTICS?.writeDataPoint({
              blobs: ["rate_limit_hit", "", rlRouteKey, "", "", ""],
              doubles: [0, 429],
              indexes: ["rate_limit_hit"],
            });
          } catch {
            // analytics is best-effort
          }

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

    // ── 2. KV cache check (GET public routes only) ──

    const isGet = method === "GET";
    const isRSC = request.headers.get("RSC") === "1";
    const isPublic = isGet && !isPrivateRoute(pathname);
    const cacheConfig = isPublic ? getCacheConfig(pathname, search, isRSC) : null;

    if (cacheConfig) {
      try {
        const cached = await env.API_CACHE_KV.get(cacheConfig.key);
        if (cached) {
          const entry: CachedResponse = JSON.parse(cached);
          return new Response(entry.body, {
            status: entry.status,
            headers: {
              "Content-Type": entry.contentType,
              "x-cache": "HIT",
              "x-trace-id": traceId,
              "Cache-Control": `public, max-age=${cacheConfig.ttl}, stale-while-revalidate=${cacheConfig.ttl}`,
            },
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
    // Cookies pass through automatically via headers copy

    const originResponse = await fetch(originUrl.toString(), {
      method,
      headers: proxyHeaders,
      body: isGet || method === "HEAD" ? undefined : request.body,
      redirect: "manual", // Don't follow redirects — pass them to client as-is
    });

    // ── 4. Cache eligible responses (fire-and-forget) ──

    if (cacheConfig && originResponse.ok) {
      const hasSetCookie = originResponse.headers.has("Set-Cookie");
      const cacheControl = originResponse.headers.get("Cache-Control") ?? "";
      const isPrivateResponse =
        cacheControl.includes("private") || cacheControl.includes("no-store");

      if (!hasSetCookie && !isPrivateResponse) {
        const contentType = originResponse.headers.get("Content-Type") ?? "text/html";
        const clone = originResponse.clone();

        ctx.waitUntil(
          clone
            .text()
            .then((body) =>
              env.API_CACHE_KV.put(
                cacheConfig.key,
                JSON.stringify({
                  body,
                  contentType,
                  status: originResponse.status,
                } satisfies CachedResponse),
                { expirationTtl: cacheConfig.ttl }
              )
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
  },
};
