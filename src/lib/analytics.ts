/**
 * Workers Analytics Engine — structured event tracking.
 *
 * Fire-and-forget event writer for cache metrics, API performance,
 * and error tracking. Queryable via Cloudflare GraphQL Analytics API.
 *
 * Free tier: 100k events/day, 90-day retention.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type EventType = "cache_hit" | "cache_miss" | "api_call" | "api_error" | "rate_limit_hit";

export interface AnalyticsEvent {
  type: EventType;
  /** Cache tier: "kv" | "db" | "isr" */
  cacheTier?: string;
  /** Content type: "anime" | "komik" */
  contentType?: string;
  /** Content ID (urlId or mangaId) */
  contentId?: string;
  /** Duration in ms */
  durationMs?: number;
  /** HTTP status code */
  status?: number;
}

/**
 * Write a structured event to Workers Analytics Engine.
 * Fire-and-forget — never throws, never blocks.
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const dataset = ctx.env.ANALYTICS;
    if (!dataset) return;

    // blobs[0] = event type, blobs[1] = cache tier, blobs[2] = content type,
    // blobs[3] = content id, blobs[4] = CF colo, blobs[5] = country
    // doubles[0] = duration ms, doubles[1] = HTTP status
    dataset.writeDataPoint({
      blobs: [
        event.type,
        event.cacheTier ?? "",
        event.contentType ?? "",
        event.contentId ?? "",
        ((ctx.cf as Record<string, unknown>)?.colo as string) ?? "",
        ((ctx.cf as Record<string, unknown>)?.country as string) ?? "",
      ],
      doubles: [event.durationMs ?? 0, event.status ?? 0],
      indexes: [event.type],
    });
  } catch {
    // Never block a request for analytics
  }
}
