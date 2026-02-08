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
          `Please set it in your Vercel dashboard or .env file.`
      );
    }
  }
}

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment
  output: "standalone",

  // Image optimization for performance
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.sansekai.my.id",
      },
      {
        protocol: "https",
        hostname: "*.sansekai.my.id",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
    // Enable modern formats for 60-80% size reduction
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 7 days
    minimumCacheTTL: 604800,
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Image sizes for thumbnails
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Mark server-only packages
  serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"],

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
