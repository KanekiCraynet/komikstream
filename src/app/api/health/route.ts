import { NextRequest, NextResponse } from "next/server";
import packageJson from "../../../../package.json";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: "connected" | "disconnected" | "skipped";
    externalApi?: "operational" | "degraded" | "unreachable" | "skipped";
  };
}

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring and load balancers.
 *
 * Query parameters:
 * - full=true: Include external API check (slower, may be blocked by bot detection)
 *
 * Default behavior (no ?full=true):
 * - Only checks database connection
 * - Fast response suitable for Azure health probes
 * - Returns 200 if DB is connected, 503 if DB is down
 *
 * With ?full=true:
 * - Also checks external API reachability
 * - Useful for manual diagnostics
 * - Note: External API may block Azure datacenter IPs (expected)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const fullCheck = searchParams.get("full") === "true";

  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: packageJson.version,
    checks: {
      database: "skipped",
    },
  };

  // Check database connection — CRITICAL dependency.
  // Without DB: auth, bookmarks, history, and cached content are broken.
  // On B1 single instance, Azure health probe will restart instance after
  // consecutive 503 failures (default: 5). Don't make this too sensitive.
  try {
    const dbUrl = process.env.DATABASE_URL;

    if (dbUrl && !dbUrl.includes("dummy")) {
      const { getSafePrisma } = await import("@/lib/prisma");
      const prisma = await getSafePrisma();

      if (prisma) {
        await prisma.$queryRaw`SELECT 1`;
        health.checks.database = "connected";
      } else {
        health.checks.database = "disconnected";
        health.status = "unhealthy";
      }
    }
  } catch (error) {
    health.checks.database = "disconnected";
    health.status = "unhealthy";
    logger.warn("Health check: database connection failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Check external API — NON-CRITICAL dependency.
  // Only run when ?full=true is specified.
  //
  // NOTE: sankavollerei.com's bot protection (Plana AI Detector) blocks
  // Azure datacenter IPs with 403 regardless of headers. This check may
  // permanently show "degraded" from Azure, which is expected and harmless.
  // The actual API client works via ISR cache + Next.js server-side fetches
  // through different code paths that are not blocked.
  if (fullCheck) {
    health.checks.externalApi = "skipped";
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        const resp = await fetch(`${apiUrl}/anime/home`, {
          signal: AbortSignal.timeout(5000),
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Accept: "application/json, text/plain, */*",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            Referer: "https://www.sankavollerei.com/anime/",
            "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
          },
        });
        health.checks.externalApi = resp.ok ? "operational" : "degraded";
      }
    } catch {
      health.checks.externalApi = "unreachable";
      // External API failure is non-critical - only degrade, don't mark unhealthy
      if (health.status === "healthy") {
        health.status = "degraded";
      }
    }
  }

  const responseTime = Date.now() - startTime;
  const httpStatus = health.status === "unhealthy" ? 503 : 200;

  return NextResponse.json(
    {
      ...health,
      responseTime: `${responseTime}ms`,
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
