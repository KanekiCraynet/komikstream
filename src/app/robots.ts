import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/sign-in", "/sign-up", "/komik/search", "/anime/search"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
