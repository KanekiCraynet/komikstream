/**
 * Prisma Client for dual-runtime (Azure Node.js + Cloudflare Workers)
 *
 * On Azure (Node.js): module-level singleton with a shared pg.Pool (max: 5).
 * This avoids creating a new pool + connection per request, reducing
 * connection churn to Supabase on the single-core B1 instance.
 *
 * On CF Workers: per-request PrismaClient via React `cache()`, required
 * because Workers forbid I/O reuse across requests.
 *
 * Runtime detection uses `typeof EdgeRuntime`:
 * - "string" on CF Workers (workerd sets globalThis.EdgeRuntime)
 * - "undefined" on Node.js (Azure, dev, CI)
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
 * 2. Imports from `@prisma/client` (NOT `/edge`) — per Prisma maintainers,
 *    `/edge` must NOT be used with driver adapters. The standard import
 *    lets package export conditions route correctly:
 *    - OpenNext esbuild with `conditions: ["workerd"]` → edge.js (WASM)
 *    - Node.js dev → index.js (binary engine)
 *    Combined with `serverExternalPackages` in next.config.ts.
 */

// EdgeRuntime is set by CF Workers (workerd) on globalThis — not in Node.js
declare const EdgeRuntime: string | undefined;

import "server-only";

import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Runtime detection — true on Node.js (Azure, dev), false on CF Workers
const isNodeRuntime = typeof EdgeRuntime === "undefined";

/**
 * Check if database is configured and not explicitly skipped.
 * SKIP_DB_CONNECTION is set in CI/Docker builds where the DB is unreachable
 * (e.g. Azure PostgreSQL behind VNet). Without this check, Prisma attempts
 * connections that always fail, producing noisy errors during SSG.
 */
export function isDatabaseConfigured(): boolean {
  if (process.env.SKIP_DB_CONNECTION === "true") return false;
  return !!process.env.DATABASE_URL;
}

// ─── Node.js singleton (Azure / dev) ─────────────────────────────────
// Module-level singleton shared across all requests. Reduces Supabase
// connection churn from O(concurrent-requests) to O(1).

let _nodeSingleton: PrismaClient | null | undefined;

function getNodeSingleton(): PrismaClient | null {
  if (_nodeSingleton !== undefined) return _nodeSingleton;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    _nodeSingleton = null;
    return null;
  }

  try {
    const adapter = new PrismaPg(
      {
        connectionString,
        min: 1,
        max: 5,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
        ssl: { rejectUnauthorized: false },
      },
      {
        onPoolError: (err) => {
          console.error("[prisma:pool] Pool error:", err.message);
        },
      }
    );

    _nodeSingleton = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
    });
    return _nodeSingleton;
  } catch (err) {
    console.error("[prisma] Failed to create PrismaClient:", err);
    _nodeSingleton = null;
    return null;
  }
}

// ─── CF Workers per-request client ───────────────────────────────────
// Each request gets its own PrismaClient + pg Pool (max: 1).
// Required because Workers forbid I/O reuse across requests.

const getWorkerDb = cache((): PrismaClient | null => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  try {
    const adapter = new PrismaPg(
      {
        connectionString,
        max: 1,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 5_000,
        ssl: { rejectUnauthorized: false },
      },
      {
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

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Get a PrismaClient appropriate for the current runtime.
 *
 * - Node.js (Azure): returns module-level singleton (shared pg.Pool, max: 5)
 * - CF Workers: returns per-request client (pg.Pool max: 1)
 * - Returns `null` if DATABASE_URL is not set.
 */
export const getDb = cache((): PrismaClient | null => {
  return isNodeRuntime ? getNodeSingleton() : getWorkerDb();
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
