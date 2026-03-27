import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";
import { generateSitemaps } from "@/app/sitemap";

/**
 * Sitemap index endpoint.
 *
 * Next.js auto-generates /sitemap.xml when using generateSitemaps(),
 * but OpenNext on Cloudflare Workers doesn't serve it. This route
 * is rewritten from /sitemap.xml via next.config.ts rewrites.
 */
export async function GET() {
  const sitemaps = await generateSitemaps();
  const baseUrl = siteConfig.url;

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps.map(
      (s) => `  <sitemap>\n    <loc>${baseUrl}/sitemap/${s.id}.xml</loc>\n  </sitemap>`
    ),
    "</sitemapindex>",
  ].join("\n");

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
