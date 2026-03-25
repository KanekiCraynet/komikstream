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
const isPublicApiRoute = createRouteMatcher(["/api/webhooks(.*)", "/api/health"]);

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

// NOTE: In-memory rate limiting has been removed.
// Cloudflare Workers are stateless (each request may hit a different isolate),
// so in-memory Maps don't work for rate limiting.
// Use Cloudflare WAF Rate Limiting Rules instead:
//   Dashboard → Security → WAF → Rate limiting rules
//   - API routes: 60 req/min per IP on /api/*
//   - Search routes: 20 req/min per IP on /api/search*

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Skip middleware for webhook routes (they have their own verification)
  if (isPublicApiRoute(req)) {
    return NextResponse.next();
  }

  if (isClerkConfigured()) {
    return clerkHandler(req, event);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
