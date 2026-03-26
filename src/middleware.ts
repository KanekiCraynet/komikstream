import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { isClerkConfigured } from "@/lib/auth-config";
import { checkRateLimitKV } from "@/lib/kv-rate-limit";
import { SEARCH_RATE_LIMIT, API_RATE_LIMIT } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/bookmark(.*)",
  "/history(.*)",
  "/api/bookmarks(.*)",
  "/api/history(.*)",
]);

// Define public routes that should skip Clerk middleware entirely
const isPublicApiRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/health",
  "/api/internal(.*)",
]);

// Define rate-limited public API routes
const isSearchRoute = createRouteMatcher(["/api/search(.*)"]);
const isPublicRateLimitedRoute = createRouteMatcher(["/api/search(.*)", "/api/anime/video(.*)"]);

// Clerk middleware handler
// Pass keys explicitly via lazy getters so they are read at request time
// (after CF Workers' populateProcessEnv runs), not at module init time
// when process.env is still empty.
const clerkHandler = clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  },
  {
    get secretKey() {
      return process.env.CLERK_SECRET_KEY;
    },
    get publishableKey() {
      return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    },
    get proxyUrl() {
      return process.env.NEXT_PUBLIC_CLERK_PROXY_URL;
    },
  }
);

/**
 * Check KV-backed rate limit for public API routes.
 * Returns a 429 response if the limit is exceeded, otherwise null.
 */
async function checkPublicRateLimit(req: NextRequest): Promise<NextResponse | null> {
  if (!isPublicRateLimitedRoute(req)) return null;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const config = isSearchRoute(req) ? SEARCH_RATE_LIMIT : API_RATE_LIMIT;
  const routeKey = isSearchRoute(req) ? "search" : "video";

  const result = await checkRateLimitKV(`${ip}:${routeKey}`, config);

  if (!result.allowed) {
    trackEvent({ type: "rate_limit_hit", contentType: routeKey });
    return NextResponse.json(
      { error: "Too Many Requests", code: "RATE_LIMIT_EXCEEDED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
  return null;
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  // Preserve trace ID injected by the Cloudflare Worker proxy (edge gateway).
  // If no Worker trace ID is present (e.g. direct Azure access), generate one.
  const traceId = req.headers.get("x-trace-id") ?? crypto.randomUUID();
  req.headers.set("x-trace-id", traceId);

  // Skip middleware for webhook routes (they have their own verification)
  if (isPublicApiRoute(req)) {
    const response = NextResponse.next();
    response.headers.set("x-trace-id", traceId);
    return response;
  }

  // KV-backed rate limiting for public API routes (search, anime/video)
  const rateLimitResponse = await checkPublicRateLimit(req);
  if (rateLimitResponse) {
    rateLimitResponse.headers.set("x-trace-id", traceId);
    return rateLimitResponse;
  }

  if (isClerkConfigured()) {
    const response = (await clerkHandler(req, event)) ?? NextResponse.next();
    response.headers.set("x-trace-id", traceId);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-trace-id", traceId);
  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
