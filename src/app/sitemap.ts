import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { isDatabaseConfigured, getSafePrisma } from "@/lib/prisma";

// Regenerate sitemaps every hour
export const revalidate = 3600;

/**
 * Generate multiple sitemaps: static pages, komik, anime.
 * Next.js auto-creates a sitemap index at /sitemap.xml.
 */
export async function generateSitemaps() {
  const ids = [{ id: 0 }]; // 0 = static pages (always present)

  if (isDatabaseConfigured()) {
    ids.push({ id: 1 }); // 1 = komik
    ids.push({ id: 2 }); // 2 = anime
  }

  return ids;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // Static pages
  if (id === 0) {
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      {
        url: `${baseUrl}/komik`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/anime`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/komik/search`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/anime/search`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/komik/genre`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/anime/genre`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      },
    ];
  }

  const prisma = await getSafePrisma();
  if (!prisma) return [];

  try {
    // Komik pages
    if (id === 1) {
      const komikList = await prisma.komik.findMany({
        select: { mangaId: true, lastScraped: true },
        orderBy: { lastScraped: "desc" },
      });
      return komikList.map((k) => ({
        url: `${baseUrl}/komik/${k.mangaId}`,
        lastModified: k.lastScraped,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }

    // Anime pages
    if (id === 2) {
      const animeList = await prisma.anime.findMany({
        select: { urlId: true, lastScraped: true },
        orderBy: { lastScraped: "desc" },
      });
      return animeList.map((a) => ({
        url: `${baseUrl}/anime/${a.urlId}`,
        lastModified: a.lastScraped,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error(`Sitemap generation failed for id ${id}:`, err);
  }

  return [];
}
