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
    const { getSafePrisma, isDatabaseConfigured } = await import("@/lib/prisma");

    if (!isDatabaseConfigured()) {
      // SKIP_DB_CONNECTION=true or DATABASE_URL missing — report degraded
      // so monitoring catches misconfigured runtime environments.
      health.checks.database = "skipped";
      health.status = "degraded";
    } else {
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
  // NOTE: External API check is best-effort and may show "degraded"
  // if the API is rate-limiting or temporarily unreachable.
  // The app handles this gracefully via ISR cache + DB stale fallback.
  if (fullCheck) {
    health.checks.externalApi = "skipped";
    try {
      const apiUrl = process.env.SANSEKAI_BASE_URL ?? "https://api.sansekai.my.id/api";
      const resp = await fetch(`${apiUrl}/anime/latest`, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: "application/json" },
      });
      health.checks.externalApi = resp.ok ? "operational" : "degraded";
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
