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
  "frame-src https: blob:",
  "connect-src 'self' https://www.sankavollerei.com https://clerk.kuromanga.me https://*.clerk.accounts.dev https://*.clerk.dev wss://*.clerk.dev",
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
  serverExternalPackages: ["@prisma/client", ".prisma/client"],

  // Azure: standalone output for zip deploy (node .next/standalone/server.js).
  // CF/local: no output mode (OpenNext wraps the build, standalone not needed).
  ...(isAzureBuild ? { output: "standalone" as const } : {}),

  // Remove X-Powered-By header (information disclosure)
  poweredByHeader: false,

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
    return [
      {
        source: "/healthz",
        destination: "/api/health",
      },
    ];
  },

  // Image optimization for performance
  // NOTE: All images currently use `unoptimized` (bypass optimization), so
  // remotePatterns only applies if `unoptimized` is removed in the future.
  // The wildcard is necessary because the external API (sankavollerei.com)
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

  // Turbopack configuration (dev server only, does not affect production builds)
  // CF Workers: force Prisma edge/WASM loader instead of Node.js base64 loader.
  // Azure: use default Prisma client (native binary engine).
  turbopack: !isAzureBuild
    ? {
        resolveAlias: {
          ".prisma/client": ".prisma/client/edge",
        },
      }
    : {},

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
