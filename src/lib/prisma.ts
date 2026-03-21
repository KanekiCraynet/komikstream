/**
 * Prisma Client for Cloudflare Workers (via OpenNext)
 *
 * Follows the official OpenNext pattern for Prisma + PostgreSQL:
 * https://opennext.js.org/cloudflare/howtos/db#postgresql-1
 *
 * Key design decisions:
 * 1. NO direct `import { Pool } from "pg"` — the adapter manages it internally.
 *    This avoids the OpenNext/esbuild externalization bug where `pg` gets
 *    split into a `pg-<hash>` external module that Workers can't resolve.
 *    (See: opennextjs/opennextjs-cloudflare #1091, #1153)
 *
 * 2. Per-request PrismaClient via React `cache()` — required by CF Workers
 *    which forbids I/O reuse across requests ("Cannot perform I/O on behalf
 *    of a different request").
 *
 * 3. Uses `@prisma/client` (not `/edge`) — the `serverExternalPackages`
 *    config in next.config.ts lets OpenNext resolve the correct `workerd`
 *    variant at bundle time.
 */

import "server-only";

import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Check if database is configured (DATABASE_URL exists).
 * Used to gracefully degrade when DB is unavailable.
 */
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Get a PrismaClient scoped to the current request via React `cache()`.
 *
 * - Each incoming request gets its own PrismaClient + pg Pool.
 * - `maxUses: 1` ensures the connection is not reused across requests.
 * - Returns `null` if DATABASE_URL is not set.
 *
 * Usage in server components / route handlers:
 *   const prisma = getDb();
 *   if (!prisma) return fallback;
 *   const data = await prisma.komik.findUnique({ ... });
 */
export const getDb = cache((): PrismaClient | null => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  try {
    // PrismaPg accepts pg.PoolConfig — no need to create a Pool manually.
    // This lets @prisma/adapter-pg manage the pg dependency internally,
    // avoiding the externalization issue with direct pg imports.
    const adapter = new PrismaPg(
      {
        connectionString,
        // Don't reuse connections across requests (CF Workers requirement)
        max: 1,
        // Supabase/Neon cold starts can take 3-7s
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 5_000,
        ssl: { rejectUnauthorized: false },
      },
      {
        // Log pool errors instead of crashing
        onPoolError: (err) => {
          console.error("[prisma:pool] Pool error:", err.message);
        },
      }
    );

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
    });
  } catch (err) {
    console.error("[prisma] Failed to create PrismaClient:", err);
    return null;
  }
});

/**
 * Safe Prisma accessor — returns PrismaClient or null.
 *
 * Wrapper around getDb() for backward compatibility with existing code
 * that uses `await getSafePrisma()`.
 */
export async function getSafePrisma(): Promise<PrismaClient | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    return getDb();
  } catch {
    return null;
  }
}
