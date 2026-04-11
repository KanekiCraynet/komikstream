import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { isDatabaseConfigured, getSafePrisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { KomikChapter, AnimeEpisode } from "@/types";

// Regenerate sitemaps every hour
export const revalidate = 3600;

// Google limit is 50,000 URLs per sitemap; keep a safe margin
const MAX_ENTRIES_PER_SITEMAP = 45_000;

// Sansekai komik uses UUID format for mangaId.
// Legacy slugs (e.g. "solo-leveling") from the old sankavollerei provider
// are invalid and should be excluded from the sitemap.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that a manga ID is a valid Sansekai UUID.
 * Filters out legacy slug-based IDs from the old data source.
 */
function isValidMangaId(mangaId: string): boolean {
  return UUID_RE.test(mangaId);
}

/**
 * Validate that an anime urlId is a non-empty string (slug format).
 */
function isValidAnimeUrlId(urlId: string): boolean {
  return urlId.length > 0 && !urlId.includes(" ");
}

/**
 * Generate multiple sitemaps: static pages, komik, anime, chapters, episodes.
 * Next.js auto-creates a sitemap index at /sitemap.xml.
 */
export async function generateSitemaps() {
  const ids = [{ id: 0 }]; // 0 = static pages (always present)

  if (isDatabaseConfigured()) {
    ids.push({ id: 1 }); // 1 = komik detail pages
    ids.push({ id: 2 }); // 2 = anime detail pages
    ids.push({ id: 3 }); // 3 = komik chapters
    ids.push({ id: 4 }); // 4 = anime episodes
  }

  return ids;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  // Next.js 16 passes id as a Promise<string> — await and convert
  const numId = Number(await id);
  const baseUrl = siteConfig.url;

  // Static pages
  if (numId === 0) {
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
        url: `${baseUrl}/anime/genre`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/komik/berwarna`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/komik/pustaka`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/anime/schedule`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      },
    ];
  }

  const prisma = await getSafePrisma();
  if (!prisma) return [];

  try {
    // Komik detail pages (UUID-only — filter out legacy slug-based IDs)
    if (numId === 1) {
      const komikList = await prisma.komik.findMany({
        select: { mangaId: true, lastScraped: true },
        orderBy: { lastScraped: "desc" },
      });
      return komikList
        .filter((k) => isValidMangaId(k.mangaId))
        .map((k) => ({
          url: `${baseUrl}/komik/${k.mangaId}`,
          lastModified: k.lastScraped,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
    }

    // Anime detail pages (valid slugs only)
    if (numId === 2) {
      const animeList = await prisma.anime.findMany({
        select: { urlId: true, lastScraped: true },
        orderBy: { lastScraped: "desc" },
      });
      return animeList
        .filter((a) => isValidAnimeUrlId(a.urlId))
        .map((a) => ({
          url: `${baseUrl}/anime/${a.urlId}`,
          lastModified: a.lastScraped,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
    }

    // Komik chapter pages — only from UUID-valid manga
    if (numId === 3) {
      const komikList = await prisma.komik.findMany({
        select: { mangaId: true, chapters: true, lastScraped: true },
        orderBy: { lastScraped: "desc" },
      });

      const entries: MetadataRoute.Sitemap = [];
      for (const k of komikList) {
        if (!isValidMangaId(k.mangaId)) continue;
        if (!k.chapters || !Array.isArray(k.chapters)) continue;
        const chapters = k.chapters as unknown as KomikChapter[];
        for (const ch of chapters) {
          if (!ch.chapter_id) continue;
          entries.push({
            url: `${baseUrl}/chapter/${ch.chapter_id}`,
            lastModified: k.lastScraped,
            changeFrequency: "monthly" as const,
            priority: 0.6,
          });
          if (entries.length >= MAX_ENTRIES_PER_SITEMAP) break;
        }
        if (entries.length >= MAX_ENTRIES_PER_SITEMAP) break;
      }
      return entries;
    }

    // Anime episode pages — only from valid anime slugs
    if (numId === 4) {
      const animeList = await prisma.anime.findMany({
        select: { urlId: true, episodes: true, lastScraped: true },
        orderBy: { lastScraped: "desc" },
      });

      const entries: MetadataRoute.Sitemap = [];
      for (const a of animeList) {
        if (!isValidAnimeUrlId(a.urlId)) continue;
        if (!a.episodes || !Array.isArray(a.episodes)) continue;
        const episodes = a.episodes as unknown as AnimeEpisode[];
        for (const ep of episodes) {
          const epId = ep.url || ep.episodeId;
          if (!epId) continue;
          entries.push({
            url: `${baseUrl}/watch/${a.urlId}/${epId}`,
            lastModified: a.lastScraped,
            changeFrequency: "monthly" as const,
            priority: 0.6,
          });
          if (entries.length >= MAX_ENTRIES_PER_SITEMAP) break;
        }
        if (entries.length >= MAX_ENTRIES_PER_SITEMAP) break;
      }
      return entries;
    }
  } catch (err) {
    logger.error(`Sitemap generation failed for id ${numId}`, {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return [];
}
