import { prisma } from "~/lib/db.server";
import packageJson from "../../package.json";

export async function loader() {
  const startTime = Date.now();
  const health = {
    status: "healthy" as "healthy" | "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: packageJson.version,
    checks: { database: "connected" as "connected" | "disconnected" },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    health.status = "unhealthy";
    health.checks.database = "disconnected";
  }

  return Response.json(
    { ...health, responseTime: `${Date.now() - startTime}ms` },
    {
      status: health.status === "healthy" ? 200 : 503,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    },
  );
}
