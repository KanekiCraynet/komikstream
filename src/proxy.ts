import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { isClerkConfigured } from "@/lib/auth-config";

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
  "/api/sitemap-index",
  "/sitemap(.*)",
]);

/**
 * Reserved slugs that should NOT be treated as manga IDs.
 * These are redirected to appropriate pages or return 404.
 */
const KOMIK_RESERVED_SLUGS: Record<string, string | null> = {
  // Redirect to anime schedule (komik doesn't have schedule)
  jadwal: "/anime/schedule",
  schedule: "/anime/schedule",
  // These are existing routes, not manga IDs — let them 404 naturally
  // if someone types /komik/search/something instead of /komik/search?q=something
};

/**
 * Reserved slugs under /anime that should redirect to proper routes.
 * Prevents [urlId] dynamic route from catching known page slugs.
 */
const ANIME_RESERVED_SLUGS: Record<string, string | null> = {
  // Indonesian "jadwal" -> English "schedule" route
  jadwal: "/anime/schedule",
};

/**
 * Handle 301 redirects for old URL structures to new SEO-friendly URLs.
 * - Old: /komik/{mangaId}/{chapterId} -> New: /chapter/{chapterId}
 * - Old: /anime/watch/{animeUrlId}/{episodeId} -> New: /watch/{animeUrlId}/{episodeId}
 * - Invalid: /komik/jadwal -> /anime/schedule (komik has no schedule)
 * - Alias: /anime/jadwal -> /anime/schedule (Indonesian alias)
 */
function handleUrlRedirects(req: NextRequest): NextResponse | null {
  const { pathname, search } = req.nextUrl;

  // Handle reserved komik slugs that shouldn't hit the [mangaId] dynamic route
  const komikSlugMatch = pathname.match(/^\/komik\/([^/]+)$/);
  if (komikSlugMatch) {
    const slug = komikSlugMatch[1].toLowerCase();
    const redirect = KOMIK_RESERVED_SLUGS[slug];
    if (redirect) {
      const newUrl = new URL(`${redirect}${search}`, req.url);
      return NextResponse.redirect(newUrl, 301);
    }
  }

  // Handle reserved anime slugs (e.g., /anime/jadwal -> /anime/schedule)
  const animeSlugMatch = pathname.match(/^\/anime\/([^/]+)$/);
  if (animeSlugMatch) {
    const slug = animeSlugMatch[1].toLowerCase();
    const redirect = ANIME_RESERVED_SLUGS[slug];
    if (redirect) {
      const newUrl = new URL(`${redirect}${search}`, req.url);
      return NextResponse.redirect(newUrl, 301);
    }
  }

  // Redirect old chapter URLs: /komik/{mangaId}/{chapterId} -> /chapter/{chapterId}
  // Only match paths with exactly 3 segments under /komik/ (the chapter reader)
  // Don't redirect /komik/{mangaId} (detail page)
  const chapterMatch = pathname.match(/^\/komik\/[^/]+\/([^/]+)$/);
  if (chapterMatch) {
    const chapterId = chapterMatch[1];
    const newUrl = new URL(`/chapter/${chapterId}${search}`, req.url);
    return NextResponse.redirect(newUrl, 301);
  }

  // Redirect old anime watch URLs: /anime/watch/{animeUrlId}/{episodeId} -> /watch/{animeUrlId}/{episodeId}
  const watchMatch = pathname.match(/^\/anime\/watch\/([^/]+)\/([^/]+)$/);
  if (watchMatch) {
    const [, animeUrlId, episodeId] = watchMatch;
    const newUrl = new URL(`/watch/${animeUrlId}/${episodeId}${search}`, req.url);
    return NextResponse.redirect(newUrl, 301);
  }

  return null;
}

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

// Rate limiting is handled entirely at the CF Worker edge proxy layer.
// Removing it from middleware eliminates redundant KV writes and reduces
// KV budget consumption on the Free tier.

/**
 * Verify that the request came through the CF Worker proxy by checking
 * the shared secret token. This prevents direct access to the Azure origin
 * which would bypass rate limiting and edge caching.
 *
 * Returns null if valid, or a 403 response if the token is missing/invalid.
 * Skipped when WORKER_TOKEN is not configured (dev/CI environments).
 */
function verifyWorkerToken(req: NextRequest): NextResponse | null {
  const expectedToken = process.env.WORKER_TOKEN;
  if (!expectedToken) return null; // Not configured — skip check (dev/CI)

  const requestToken = req.headers.get("x-worker-token");
  if (requestToken === expectedToken) return null;

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  // Preserve trace ID injected by the Cloudflare Worker proxy (edge gateway).
  // If no Worker trace ID is present (e.g. direct Azure access), generate one.
  const traceId = req.headers.get("x-trace-id") ?? crypto.randomUUID();
  req.headers.set("x-trace-id", traceId);

  // Handle 301 redirects for old URL structures (before other checks)
  const redirectResponse = handleUrlRedirects(req);
  if (redirectResponse) {
    redirectResponse.headers.set("x-trace-id", traceId);
    return redirectResponse;
  }

  // Verify request came through the CF Worker (structural security control).
  // Azure IP allowlist is the first layer; this token is the second layer.
  const tokenResponse = verifyWorkerToken(req);
  if (tokenResponse) {
    tokenResponse.headers.set("x-trace-id", traceId);
    return tokenResponse;
  }

  // Skip middleware for webhook routes (they have their own verification)
  if (isPublicApiRoute(req)) {
    const response = NextResponse.next();
    response.headers.set("x-trace-id", traceId);
    return response;
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
