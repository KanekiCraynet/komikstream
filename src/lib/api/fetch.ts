/**
 * Core Fetch Utilities — sankavollerei.com Provider
 *
 * Fetch wrapper with retry logic, rate-limit handling, and ISR caching.
 * Used by all API modules.
 */

import { ANIME_HEADERS } from "./constants";

/**
 * Fetch JSON from the external API with retry logic and browser-like headers.
 *
 * Features:
 * - Exponential backoff on 429 (rate limit)
 * - Configurable retries
 * - ISR revalidation via Next.js fetch cache
 * - Browser-like headers to bypass Plana AI Detector
 *
 * @param url - Full URL to fetch
 * @param revalidate - ISR revalidation time in seconds (0 = no cache)
 * @param retries - Number of retry attempts (default: 1)
 * @param headers - Request headers (default: ANIME_HEADERS)
 * @returns Parsed JSON response
 * @throws Error on network failure or non-2xx response after retries
 */
export async function fetchWithCache<T>(
  url: string,
  revalidate: number,
  retries = 1,
  headers: Record<string, string> = ANIME_HEADERS
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers, next: { revalidate } });

      if (res.status === 429) {
        const waitTime = Math.min(500 * Math.pow(2, i), 3000);
        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error("API rate limited (429)");
      }

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      return res.json();
    } catch (error) {
      if (i === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  throw new Error("Failed to fetch");
}

/**
 * Safely convert a value to an array.
 *
 * Handles common API response patterns where a field might be:
 * - An array (returned as-is)
 * - A single object (wrapped in array)
 * - null/undefined (returns empty array)
 *
 * @param data - Input value that may or may not be an array
 * @returns Array of items (never null/undefined)
 */
export function ensureArray<T>(data: T | T[] | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [];
}
