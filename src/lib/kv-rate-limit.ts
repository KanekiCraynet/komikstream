/**
 * KV-backed rate limiter with in-memory fallback.
 *
 * Uses a fixed window stored as JSON in KV with automatic expiration.
 * Falls back to in-memory rate limiting if KV is unavailable.
 *
 * KV consistency model: "eventually consistent" — reads may be stale
 * by up to 60s globally, but within the same CF colo they are consistent.
 * For rate limiting this is acceptable: the goal is abuse prevention,
 * not a hard cap.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { checkRateLimit, type RateLimitConfig, type RateLimitResult } from "./rate-limit";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export async function checkRateLimitKV(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = env.RATE_LIMIT_KV;
    if (!kv) throw new Error("RATE_LIMIT_KV not bound");

    const kvKey = `rl:${key}`;
    const now = Date.now();

    const existing = await kv.get<RateLimitEntry>(kvKey, "json");

    if (!existing || now > existing.resetAt) {
      // New window
      const resetAt = now + config.windowSeconds * 1000;
      await kv.put(kvKey, JSON.stringify({ count: 1, resetAt }), {
        expirationTtl: config.windowSeconds + 5,
      });
      return { allowed: true, remaining: config.maxRequests - 1, resetAt };
    }

    const newCount = existing.count + 1;
    const remaining = Math.max(0, config.maxRequests - newCount);
    const ttlSeconds = Math.ceil((existing.resetAt - now) / 1000);

    if (ttlSeconds > 0) {
      await kv.put(kvKey, JSON.stringify({ count: newCount, resetAt: existing.resetAt }), {
        expirationTtl: ttlSeconds,
      });
    }

    return {
      allowed: newCount <= config.maxRequests,
      remaining,
      resetAt: existing.resetAt,
    };
  } catch {
    // KV unavailable or not bound — fall back to in-memory
    return checkRateLimit(key, config);
  }
}
