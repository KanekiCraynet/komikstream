/**
 * Unified Analytics — Dual-Mode Event Tracking
 *
 * Works in BOTH deployment environments:
 * - Cloudflare Workers: Uses CF Analytics Engine (via worker proxy)
 * - Azure App Service: Uses Azure Application Insights
 *
 * Fire-and-forget event writer for cache metrics, API performance,
 * and error tracking. Never blocks request processing.
 *
 * CF Analytics: 100k events/day, 90-day retention
 * Azure App Insights: Based on configured data cap
 *
 * NOTE: This module is imported through chains that include Client Components,
 * so we cannot use "server-only". Runtime checks handle client/server detection.
 */

import type { TelemetryClient } from "applicationinsights";

// ─── Event Types ────────────────────────────────────────────────────

export type EventType =
  | "cache_hit"
  | "cache_miss"
  | "cache_stale"
  | "api_call"
  | "api_success"
  | "api_error"
  | "api_retry"
  | "api_timeout"
  | "rate_limit_hit"
  | "db_error";

export type CacheTier = "kv" | "db" | "api" | "stale";
export type ContentType = "anime" | "komik" | "chapter" | "search" | "homepage";

export interface AnalyticsEvent {
  type: EventType;
  /** Cache tier: "kv" | "db" | "api" | "stale" */
  cacheTier?: CacheTier;
  /** Content type: "anime" | "komik" | "chapter" | "search" | "homepage" */
  contentType?: ContentType;
  /** Content ID (urlId or mangaId) */
  contentId?: string;
  /** Duration in ms */
  durationMs?: number;
  /** HTTP status code */
  status?: number;
  /** Additional context (e.g., endpoint, error message) */
  context?: string;
  /** Retry attempt number (0 = first try) */
  retryCount?: number;
}

// ─── Environment Detection ──────────────────────────────────────────

/**
 * Detect if running in Cloudflare Workers environment.
 * In CF Workers, `caches` global exists and `process.env.NEXT_RUNTIME` is undefined.
 */
function isCloudflareWorker(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    "caches" in globalThis &&
    typeof (globalThis as Record<string, unknown>).caches === "object" &&
    process.env.NEXT_RUNTIME !== "nodejs"
  );
}

// ─── Azure App Insights Client ──────────────────────────────────────

let appInsightsClient: TelemetryClient | null = null;
let appInsightsInitialized = false;

/**
 * Lazily initialize App Insights client.
 * Only runs once, only in Node.js runtime (Azure).
 */
async function getAppInsightsClient() {
  if (appInsightsInitialized) return appInsightsClient;
  appInsightsInitialized = true;

  // Only initialize in Node.js runtime
  if (process.env.NEXT_RUNTIME !== "nodejs") return null;

  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString) return null;

  try {
    const appInsights = await import("applicationinsights");
    // Don't call setup() again if already initialized by instrumentation.ts
    // Just get the default client
    if (appInsights.defaultClient) {
      appInsightsClient = appInsights.defaultClient;
    }
    return appInsightsClient;
  } catch {
    // App Insights not available — likely edge runtime or missing dependency
    return null;
  }
}

// ─── CF Analytics Engine (Worker Proxy) ─────────────────────────────

/**
 * Track event via CF Analytics Engine in Workers environment.
 * This is called from the thin proxy worker (workers/proxy/index.ts),
 * NOT from the Next.js app running on Azure.
 *
 * For Azure deployment, this is a no-op since getCloudflareContext()
 * requires OpenNext which isn't used in production.
 */
async function trackViaCFAnalytics(event: AnalyticsEvent): Promise<boolean> {
  // Skip in Azure — CF Analytics is only for the thin worker proxy
  if (!isCloudflareWorker()) return false;

  try {
    // Dynamic import to avoid bundling @opennextjs/cloudflare in Azure build
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const dataset = ctx?.env?.ANALYTICS;
    if (!dataset) return false;

    // Schema: blobs[0]=type, blobs[1]=cacheTier, blobs[2]=contentType,
    // blobs[3]=contentId, blobs[4]=context, blobs[5]=colo
    // doubles[0]=durationMs, doubles[1]=status, doubles[2]=retryCount
    dataset.writeDataPoint({
      blobs: [
        event.type,
        event.cacheTier ?? "",
        event.contentType ?? "",
        event.contentId ?? "",
        event.context ?? "",
        ((ctx.cf as Record<string, unknown>)?.colo as string) ?? "",
      ],
      doubles: [event.durationMs ?? 0, event.status ?? 0, event.retryCount ?? 0],
      indexes: [event.type],
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Azure App Insights Tracking ────────────────────────────────────

/**
 * Track event via Azure Application Insights.
 * Maps our event schema to App Insights custom events and metrics.
 */
async function trackViaAppInsights(event: AnalyticsEvent): Promise<boolean> {
  const client = await getAppInsightsClient();
  if (!client) return false;

  try {
    // Track as custom event with properties
    client.trackEvent({
      name: event.type,
      properties: {
        cacheTier: event.cacheTier ?? "",
        contentType: event.contentType ?? "",
        contentId: event.contentId ?? "",
        context: event.context ?? "",
        retryCount: event.retryCount?.toString() ?? "0",
      },
      measurements: {
        durationMs: event.durationMs ?? 0,
        status: event.status ?? 0,
      },
    });

    // Also track duration as a metric for easier aggregation
    if (event.durationMs !== undefined) {
      client.trackMetric({
        name: `${event.type}_duration_ms`,
        value: event.durationMs,
        properties: {
          cacheTier: event.cacheTier ?? "",
          contentType: event.contentType ?? "",
        },
      });
    }

    return true;
  } catch {
    return false;
  }
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Track a structured analytics event.
 * Fire-and-forget — never throws, never blocks request processing.
 *
 * Routes to appropriate backend based on runtime:
 * - CF Workers → CF Analytics Engine
 * - Azure Node.js → Azure App Insights
 * - Fallback → Console (dev only)
 *
 * @example
 * trackEvent({
 *   type: "cache_hit",
 *   cacheTier: "db",
 *   contentType: "komik",
 *   contentId: "one-piece",
 *   durationMs: 15
 * });
 */
export function trackEvent(event: AnalyticsEvent): void {
  // Fire-and-forget — don't await, don't block
  void (async () => {
    try {
      // Try CF Analytics first (for Worker proxy)
      if (await trackViaCFAnalytics(event)) return;

      // Try Azure App Insights (for Azure App Service)
      if (await trackViaAppInsights(event)) return;

      // Fallback: log in development only
      if (process.env.NODE_ENV === "development") {
        console.debug("[analytics]", event.type, {
          tier: event.cacheTier,
          content: event.contentType,
          id: event.contentId,
          ms: event.durationMs,
          status: event.status,
        });
      }
    } catch {
      // Never fail a request for analytics
    }
  })();
}

/**
 * Track cache performance with timing.
 * Convenience wrapper that measures elapsed time.
 */
export function trackCacheEvent(
  type: "cache_hit" | "cache_miss" | "cache_stale",
  tier: CacheTier,
  contentType: ContentType,
  contentId: string,
  startTime: number
): void {
  trackEvent({
    type,
    cacheTier: tier,
    contentType,
    contentId,
    durationMs: Date.now() - startTime,
  });
}

/**
 * Track API call with result.
 * Convenience wrapper for external API calls.
 */
export function trackApiEvent(
  type: "api_success" | "api_error" | "api_retry" | "api_timeout",
  context: string,
  startTime: number,
  status?: number,
  retryCount?: number
): void {
  trackEvent({
    type,
    context,
    durationMs: Date.now() - startTime,
    status,
    retryCount,
  });
}
