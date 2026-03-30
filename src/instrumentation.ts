/**
 * Next.js Instrumentation Hook
 *
 * Called once when a new Next.js server instance starts.
 * Initializes Azure Application Insights for server-side telemetry
 * (request tracing, dependency tracking, error logging).
 *
 * Only runs on Node.js runtime (Azure). Skipped on Edge runtime (CF Workers)
 * where App Insights cannot run.
 *
 * Requires APPLICATIONINSIGHTS_CONNECTION_STRING in Azure App Settings.
 * Without it, App Insights silently skips initialization.
 */
export async function register() {
  // Only initialize on Node.js runtime (Azure App Service)
  // Edge runtime (CF Workers) cannot use App Insights
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (!connectionString) {
      console.warn(
        "[instrumentation] APPLICATIONINSIGHTS_CONNECTION_STRING not set, skipping App Insights"
      );
      return;
    }

    try {
      const appInsights = await import("applicationinsights");
      appInsights
        .setup(connectionString)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(false) // avoid noise from console.log
        .setSendLiveMetrics(false) // save overhead on B1
        .start();

      console.log("[instrumentation] Azure Application Insights initialized");
    } catch (err) {
      console.error("[instrumentation] Failed to initialize App Insights:", err);
    }
  }
}
