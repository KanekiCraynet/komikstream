import { NextResponse } from "next/server";
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
    externalApi: "operational" | "degraded" | "unreachable";
  };
}

export async function GET() {
  const startTime = Date.now();

  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: packageJson.version,
    checks: {
      database: "skipped",
      externalApi: "operational",
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
  // Without it: UX degrades (no fresh content), but site serves cached data.
  // Does NOT warrant 503 or instance restart.
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      const resp = await fetch(`${apiUrl}/anime/home`, {
        signal: AbortSignal.timeout(2000),
        headers: { Accept: "application/json" },
      });
      health.checks.externalApi = resp.ok ? "operational" : "degraded";
    }
  } catch {
    health.checks.externalApi = "unreachable";
    if (health.status === "healthy") {
      health.status = "degraded";
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
