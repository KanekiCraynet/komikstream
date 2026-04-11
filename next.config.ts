import type { NextConfig } from "next";

// Validate critical environment variables at build time
const requiredEnvVars = [
  "DATABASE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const;

// Only validate in production builds (not during CI/testing)
if (process.env.NODE_ENV === "production" && !process.env.CI) {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(
        `⚠️ Missing environment variable: ${envVar}\n` +
          `Please set it in your deployment platform (Azure App Settings / CF Workers Variables) or .env file.`
      );
    }
  }
}

// Content Security Policy
// - frame-src: allows video embeds from any HTTPS source (dynamic third-party player URLs)
// - img-src: allows HTTPS images from any source (external manga/anime cover CDNs)
// - script-src: 'unsafe-eval'/'unsafe-inline' needed for Next.js dev mode and Clerk;
//   clerk.kuromanga.me is the production Clerk Frontend API (loads clerk-js SDK);
//   static.cloudflareinsights.com is the Cloudflare Web Analytics beacon script
//   automatically injected by CF Workers — must be allowed to avoid CSP violations
// - connect-src: allows API calls to the external data source and Clerk auth endpoints
// - worker-src: Clerk uses web workers for session token refresh
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.kuromanga.me https://*.clerk.accounts.dev https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  "frame-src 'self' https: https://challenges.cloudflare.com",
  "connect-src 'self' https://api.sansekai.my.id https://clerk.kuromanga.me https://*.clerk.accounts.dev https://*.clerk.dev wss://*.clerk.dev",
  "media-src 'self' https: blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    // HSTS: enforce HTTPS for 2 years, including subdomains.
    // Do NOT add preload until ALL subdomains (img.kuromanga.me,
    // clerk.kuromanga.me, etc.) are confirmed HTTPS-only.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
];

// BUILD_TARGET=azure → standalone output for Azure App Service zip deploy.
// Unset (default) → no output mode, compatible with OpenNext CF build and local dev.
const isAzureBuild = process.env.BUILD_TARGET === "azure";

const nextConfig: NextConfig = {
  // Prisma client is always server-external — both CF Workers (OpenNext esbuild
  // rebundles with workerd condition) and Azure (Node.js resolves from node_modules).
  // react/react-dom: explicitly listed to ensure they're traced into standalone output
  // (Next.js tracer sometimes misses them, causing "Cannot find module 'react'" on Azure).
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    // App Insights + all OpenTelemetry deps — pnpm symlinks cause the standalone
    // tracer to miss these; listing them as external forces proper tracing.
    "applicationinsights",
    "@azure/monitor-opentelemetry",
    "@azure/monitor-opentelemetry-exporter",
    "@azure/opentelemetry-instrumentation-azure-sdk",
    "@opentelemetry/api",
    "@opentelemetry/api-logs",
    "@opentelemetry/core",
    "@opentelemetry/exporter-logs-otlp-http",
    "@opentelemetry/exporter-metrics-otlp-http",
    "@opentelemetry/exporter-metrics-otlp-proto",
    "@opentelemetry/exporter-trace-otlp-http",
    "@opentelemetry/otlp-exporter-base",
    "@opentelemetry/resources",
    "@opentelemetry/sdk-logs",
    "@opentelemetry/sdk-metrics",
    "@opentelemetry/sdk-trace-base",
    "@opentelemetry/sdk-trace-node",
    "@opentelemetry/semantic-conventions",
    "@opentelemetry/instrumentation",
    // require-in-the-middle + import-in-the-middle: required by @opentelemetry/instrumentation
    "require-in-the-middle",
    "import-in-the-middle",
    "shimmer",
    "react",
    "react-dom",
  ],

  // Azure: standalone output for zip deploy (node .next/standalone/server.js).
  // CF/local: no output mode (OpenNext wraps the build, standalone not needed).
  ...(isAzureBuild ? { output: "standalone" as const } : {}),

  // Remove X-Powered-By header (information disclosure)
  poweredByHeader: false,

  // Enable gzip compression at the Node.js level.
  // Azure origin does not compress by default. Cloudflare adds Brotli on
  // the edge-to-browser leg, but the Azure-to-CF Worker leg is uncompressed.
  // This reduces bandwidth on that internal hop (~60-70% for HTML).
  compress: true,

  // Security headers (defense-in-depth for Docker/standalone deployment)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Rewrites (migrated from vercel.json)
  async rewrites() {
    return {
      // beforeFiles: checked before pages/public files — required for
      // /sitemap.xml because Next.js standalone mode pre-renders a 404
      // for that path instead of serving the built-in sitemap index.
      beforeFiles: [
        {
          source: "/sitemap.xml",
          destination: "/api/sitemap-index",
        },
      ],
      afterFiles: [
        {
          source: "/healthz",
          destination: "/api/health",
        },
      ],
      fallback: [],
    };
  },

  // Image optimization for performance
  // NOTE: All images currently use `unoptimized` (bypass optimization), so
  // remotePatterns only applies if `unoptimized` is removed in the future.
  // The wildcard is necessary because the external API (api.sansekai.my.id)
  // returns cover images from unpredictable CDN hostnames.
  // Mitigations: HTTPS-only, CSP img-src restricts to https:/data:/blob:.
  // TODO: Replace with an image proxy (e.g. /api/img?url=...) to remove wildcard.
  images: {
    // Bypass Next.js image optimization — too CPU-heavy for Cloudflare Workers.
    // Images are served directly from external CDNs.
    // Cloudflare's automatic Polish/Mirage handles optimization at CDN level.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // CF Workers: bundle pg/Prisma into the worker script (workerd can't load externals).
  // Azure/Node.js: not needed — Node resolves these from node_modules natively.
  ...(!isAzureBuild
    ? {
        transpilePackages: [
          "pg",
          "pg-pool",
          "pg-protocol",
          "pg-types",
          "pg-cloudflare",
          "@prisma/adapter-pg",
        ],
      }
    : {}),

  // Turbopack configuration.
  // NOTE: As of Next.js 16, Turbopack is the default bundler for BOTH dev and build.
  // For Azure production builds, we use --webpack flag to opt out (see build:azure script)
  // because Turbopack has known issues with React Client Manifest generation.
  // This config below only applies when Turbopack IS used (dev mode or CF builds).
  // CF Workers: force Prisma edge/WASM loader instead of Node.js base64 loader.
  // Azure: use default Prisma client (native binary engine).
  turbopack: !isAzureBuild
    ? {
        resolveAlias: {
          ".prisma/client": ".prisma/client/edge",
        },
      }
    : {},

  // Include transitive dependencies in standalone build trace.
  // Next.js standalone output uses file tracing to determine which node_modules
  // to copy. Some transitive dependencies are missed by the tracer, causing
  // "Cannot find module" errors at runtime on Azure:
  // - react, react-dom: core React runtime (sometimes missed by tracer)
  // - @next/env: environment variable handling (direct dep of next)
  // - @swc/helpers: runtime helpers used by Next.js/SWC transpilation
  // - styled-jsx: peer dependency for Next.js CSS-in-JS
  // - .prisma/client: generated Prisma client (serverExternalPackages are NOT auto-traced)
  // - @prisma/client: Prisma client runtime
  // - @prisma/adapter-pg: PostgreSQL adapter for Prisma
  // - pg, pg-pool: PostgreSQL driver dependencies
  // Only apply for Azure builds where output: 'standalone' is enabled.
  ...(isAzureBuild
    ? {
        outputFileTracingIncludes: {
          "/*": [
            "./node_modules/react/**/*",
            "./node_modules/react-dom/**/*",
            "./node_modules/@next/env/**/*",
            "./node_modules/@swc/helpers/**/*",
            "./node_modules/styled-jsx/**/*",
            "./node_modules/.prisma/client/**/*",
            // Use wildcard to include ALL @prisma/* sub-packages.
            // Prisma 7 refactored internals into separate packages
            // (@prisma/client-runtime-utils, @prisma/driver-adapter-utils, etc.)
            // that the file tracer misses when only @prisma/client is listed.
            "./node_modules/@prisma/**/*",
            "./node_modules/pg/**/*",
            "./node_modules/pg-pool/**/*",
            "./node_modules/pg-types/**/*",
            "./node_modules/pg-protocol/**/*",
            // @opentelemetry/* packages required by applicationinsights SDK
            "./node_modules/@opentelemetry/**/*",
          ],
        },
      }
    : {}),

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
