/**
 * Augment the CloudflareEnv interface (declared globally by @opennextjs/cloudflare)
 * with custom bindings for this project.
 */
declare global {
  interface CloudflareEnv {
    /** KV namespace for cross-instance rate limiting */
    RATE_LIMIT_KV: KVNamespace;
    /** KV namespace for API response caching (L1 before Supabase) */
    API_CACHE_KV: KVNamespace;
    /** Workers Analytics Engine for structured event tracking */
    ANALYTICS: AnalyticsEngineDataset;
  }
}

export {};
