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
          `Please set it in your Cloudflare Workers Variables or .env file.`
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
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
];

const nextConfig: NextConfig = {
  // NOTE: output "standalone" is only for Docker deployment.
  // For Cloudflare Workers (via OpenNext), do NOT set output.
  // Uncomment the line below if switching back to Docker/Vercel:
  // output: "standalone",

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

  // OpenNext Cloudflare: Mark Prisma packages as server external so that
  // OpenNext's esbuild step bundles them with the `workerd` condition.
  // This resolves Prisma's worker-specific exports (WASM loader, etc.)
  // correctly, without needing manual transpilePackages or resolveAlias.
  // See: https://opennext.js.org/cloudflare/howtos/workerd
  // See: https://opennext.js.org/cloudflare/howtos/db#nextconfigts
  serverExternalPackages: ["@prisma/client", ".prisma/client"],

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
