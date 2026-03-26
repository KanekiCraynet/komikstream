/**
 * KV-backed API response cache helpers.
 *
 * Provides a fast L1 cache layer in front of Supabase PostgreSQL.
 * Uses Cloudflare KV via getCloudflareContext() with automatic TTL expiration.
 * All operations are fire-and-forget safe — never throw.
 */

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Read a cached value from KV.
 * Returns null on miss or if KV is unavailable.
 */
export async function kvCacheGet<T>(key: string): Promise<T | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.API_CACHE_KV) return null;
    return await env.API_CACHE_KV.get<T>(key, "json");
  } catch {
    return null;
  }
}

/**
 * Write a value to KV with automatic TTL expiration.
 * Fire-and-forget — never throws.
 */
export async function kvCachePut(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.API_CACHE_KV) return;
    await env.API_CACHE_KV.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });
  } catch {
    // Fire-and-forget — never block a request for caching
  }
}
