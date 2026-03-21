import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: "connected" | "disconnected" | "skipped";
    api: "operational";
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
      api: "operational",
    },
  };

  // Check database connection if available
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
      }
    }
  } catch (error) {
    health.checks.database = "disconnected";
    logger.warn("Health check: database connection failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    // DB is optional (used only for caching + user features).
    // Don't fail the health check for DB issues — the site works
    // via external API fallback even without a database connection.
  }

  const responseTime = Date.now() - startTime;

  return NextResponse.json(
    {
      ...health,
      responseTime: `${responseTime}ms`,
    },
    {
      status: health.status === "healthy" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
