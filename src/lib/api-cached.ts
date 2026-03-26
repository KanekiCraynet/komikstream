/**
 * Cached API Layer (Server-only)
 *
 * DB-first caching strategy:
 *  1. Check DB cache (with TTL via lastScraped)
 *  2. If fresh cache hit -> return mapped data
 *  3. If miss/stale -> fetch from external API
 *  4. Upsert result to DB cache (fire-and-forget for lists)
 *  5. Return data
 *
 * For detail pages: full DB-first caching with TTL
 * For list pages: fetch from API, warm DB cache in background
 */

import "server-only";

import type { Anime, Komik } from "@/types";
import { CACHE_TIMES } from "./cache-config";
import {
  extractEpisodeNumber,
  getAnimeDetail,
  getAnimeLatest,
  getAnimeRecommended,
  getKomikDetail,
  getKomikLatest,
  getKomikPopular,
} from "./api-client";
import { findCachedAnime, upsertCachedAnime, findCachedKomik, upsertCachedKomik } from "./db";
import { isDatabaseConfigured } from "./prisma";
import { logger } from "./logger";
import { kvCacheGet, kvCachePut } from "./kv-cache";
import { trackEvent } from "./analytics";

// ─── Type Mappers: DB -> App Types ──────────────────────────────────

type DbAnime = NonNullable<Awaited<ReturnType<typeof findCachedAnime>>>;
type DbKomik = NonNullable<Awaited<ReturnType<typeof findCachedKomik>>>;

function mapDbAnimeToApp(db: DbAnime): Anime {
  const genres = Array.isArray(db.genres) ? (db.genres as string[]) : [];
  const episodes = Array.isArray(db.episodes)
    ? (db.episodes as Array<{ title?: string; url?: string; date?: string }>)
        .map((ep) => ({
          title: ep.title || "",
          url: ep.url,
          date: ep.date,
        }))
        // Sort ascending by episode number so episodes[0] = first, episodes[last] = latest.
        // DB cache stores episodes in the same descending order as the external API.
        .sort((a, b) => extractEpisodeNumber(a.title) - extractEpisodeNumber(b.title))
    : [];

  return {
    urlId: db.urlId,
    title: db.title,
    thumbnail: db.cover,
    cover: db.cover,
    synopsis: db.synopsis ?? undefined,
    rating: db.rating ?? undefined,
    type: db.type ?? undefined,
    status: db.status ?? undefined,
    genres,
    episodes,
    totalEpisodes: db.totalEpisodes ?? undefined,
  };
}

function mapDbKomikToApp(db: DbKomik): Komik {
  const genres = Array.isArray(db.genres) ? (db.genres as string[]) : [];
  const authors = Array.isArray(db.authors) ? (db.authors as string[]) : [];
  const artists = Array.isArray(db.artists) ? (db.artists as string[]) : [];
  const chapters = Array.isArray(db.chapters)
    ? (
        db.chapters as Array<{
          chapter_id?: string;
          id?: string;
          title?: string;
          chapter?: number;
          chapter_number?: number;
          date?: string;
          created_at?: string;
        }>
      ).map((ch) => ({
        chapter_id: ch.chapter_id || ch.id || "",
        title: ch.title || `Chapter ${ch.chapter || ch.chapter_number}`,
        chapter: ch.chapter || ch.chapter_number,
        date: ch.date || ch.created_at,
      }))
    : [];

  return {
    manga_id: db.mangaId,
    title: db.title,
    thumbnail: db.coverImage,
    cover: db.coverPortrait || db.coverImage,
    type: db.type ?? undefined,
    status: db.status != null ? (db.status === 1 ? "Ongoing" : "Completed") : undefined,
    rating: db.rating ?? undefined,
    description: db.synopsis ?? undefined,
    author: authors[0] ?? undefined,
    artist: artists[0] ?? undefined,
    genres,
    chapters,
    latestChapter: db.latestChapterId ?? undefined,
    updatedAt: db.latestChapterDate?.toISOString() ?? undefined,
  };
}

// ─── App Type -> DB Upsert Mappers ──────────────────────────────────

function mapAppAnimeToDb(anime: Anime) {
  const rating =
    anime.rating != null
      ? typeof anime.rating === "string"
        ? parseFloat(anime.rating)
        : anime.rating
      : null;

  return {
    urlId: anime.urlId,
    title: anime.title,
    cover: anime.thumbnail || anime.cover || "",
    synopsis: anime.synopsis || anime.description || null,
    status: anime.status || null,
    type: anime.type || null,
    totalEpisodes: anime.totalEpisodes || null,
    rating: Number.isFinite(rating) ? rating : null,
    genres: anime.genres || [],
    episodes: anime.episodes || [],
  };
}

function mapAppKomikToDb(komik: Komik) {
  const rating =
    komik.rating != null
      ? typeof komik.rating === "string"
        ? parseFloat(komik.rating as string)
        : Number(komik.rating)
      : null;
  const statusNum =
    komik.status != null
      ? typeof komik.status === "string"
        ? komik.status.toLowerCase().includes("ongoing")
          ? 1
          : 0
        : null
      : null;

  return {
    mangaId: komik.manga_id,
    title: komik.title,
    coverImage: komik.thumbnail || komik.cover || "",
    coverPortrait: komik.cover || null,
    synopsis: komik.description || null,
    status: statusNum,
    type: komik.type || null,
    rating: Number.isFinite(rating) ? rating : null,
    genres: komik.genres || [],
    authors: komik.author ? [komik.author] : [],
    artists: komik.artist ? [komik.artist] : [],
    chapters: komik.chapters || [],
    latestChapterId: komik.latestChapter || null,
  };
}

// ─── Background Cache Warming ───────────────────────────────────────

/**
 * Fire-and-forget: upsert a list of anime items to DB cache.
 * Errors are logged but never thrown.
 */
function warmAnimeCacheInBackground(items: Anime[]) {
  if (!isDatabaseConfigured() || items.length === 0) return;

  // Don't await — fire-and-forget
  Promise.all(
    items.map((anime) =>
      upsertCachedAnime(mapAppAnimeToDb(anime)).catch((err) => {
        logger.debug("Failed to cache anime", { urlId: anime.urlId, error: String(err) });
      })
    )
  ).catch(() => {
    // swallow batch-level errors
  });
}

/**
 * Fire-and-forget: upsert a list of komik items to DB cache.
 */
function warmKomikCacheInBackground(items: Komik[]) {
  if (!isDatabaseConfigured() || items.length === 0) return;

  Promise.all(
    items.map((komik) =>
      upsertCachedKomik(mapAppKomikToDb(komik)).catch((err) => {
        logger.debug("Failed to cache komik", { mangaId: komik.manga_id, error: String(err) });
      })
    )
  ).catch(() => {
    // swallow batch-level errors
  });
}

// ─── Cached Detail Endpoints ────────────────────────────────────────

/**
 * Get anime detail with three-tier caching: KV -> DB -> External API.
 * TTL = CACHE_TIMES.DETAIL (30 minutes).
 */
export async function getCachedAnimeDetail(urlId: string): Promise<Anime | null> {
  // L1: KV cache (fastest, cross-instance)
  const kvKey = `anime:${urlId}`;
  const kvHit = await kvCacheGet<Anime>(kvKey);
  if (kvHit) {
    logger.debug("Anime KV cache hit", { urlId });
    trackEvent({ type: "cache_hit", cacheTier: "kv", contentType: "anime", contentId: urlId });
    return kvHit;
  }

  // L2: Supabase DB cache
  if (isDatabaseConfigured()) {
    try {
      const cached = await findCachedAnime(urlId, CACHE_TIMES.DETAIL);
      if (cached) {
        logger.debug("Anime DB cache hit", { urlId });
        trackEvent({ type: "cache_hit", cacheTier: "db", contentType: "anime", contentId: urlId });
        const anime = mapDbAnimeToApp(cached);
        // Backfill KV (fire-and-forget)
        kvCachePut(kvKey, anime, CACHE_TIMES.DETAIL);
        return anime;
      }
      logger.debug("Anime cache miss", { urlId });
      trackEvent({ type: "cache_miss", contentType: "anime", contentId: urlId });
    } catch (err) {
      logger.warn("Anime DB cache read failed, falling back to API", {
        urlId,
        error: String(err),
      });
    }
  }

  // L3: External API
  try {
    const anime = await getAnimeDetail(urlId);

    // Write back to both caches (fire-and-forget)
    if (anime) {
      kvCachePut(kvKey, anime, CACHE_TIMES.DETAIL);
      if (isDatabaseConfigured()) {
        upsertCachedAnime(mapAppAnimeToDb(anime)).catch((err) => {
          logger.debug("Failed to write anime DB cache", { urlId, error: String(err) });
        });
      }
    }

    return anime;
  } catch (err) {
    logger.warn("Anime API fallback failed", { urlId, error: String(err) });
    return null;
  }
}

/**
 * Get komik detail with three-tier caching: KV -> DB -> External API.
 * TTL = CACHE_TIMES.DETAIL (30 minutes).
 */
export async function getCachedKomikDetail(mangaId: string): Promise<Komik | null> {
  // L1: KV cache (fastest, cross-instance)
  const kvKey = `komik:${mangaId}`;
  const kvHit = await kvCacheGet<Komik>(kvKey);
  if (kvHit) {
    logger.debug("Komik KV cache hit", { mangaId });
    trackEvent({ type: "cache_hit", cacheTier: "kv", contentType: "komik", contentId: mangaId });
    return kvHit;
  }

  // L2: Supabase DB cache
  if (isDatabaseConfigured()) {
    try {
      const cached = await findCachedKomik(mangaId, CACHE_TIMES.DETAIL);
      if (cached) {
        logger.debug("Komik DB cache hit", { mangaId });
        trackEvent({
          type: "cache_hit",
          cacheTier: "db",
          contentType: "komik",
          contentId: mangaId,
        });
        const komik = mapDbKomikToApp(cached);
        // Backfill KV (fire-and-forget)
        kvCachePut(kvKey, komik, CACHE_TIMES.DETAIL);
        return komik;
      }
      logger.debug("Komik cache miss", { mangaId });
      trackEvent({ type: "cache_miss", contentType: "komik", contentId: mangaId });
    } catch (err) {
      logger.warn("Komik DB cache read failed, falling back to API", {
        mangaId,
        error: String(err),
      });
    }
  }

  // L3: External API
  try {
    const komik = await getKomikDetail(mangaId);

    // Write back to both caches (fire-and-forget)
    if (komik) {
      kvCachePut(kvKey, komik, CACHE_TIMES.DETAIL);
      if (isDatabaseConfigured()) {
        upsertCachedKomik(mapAppKomikToDb(komik)).catch((err) => {
          logger.debug("Failed to write komik DB cache", { mangaId, error: String(err) });
        });
      }
    }

    return komik;
  } catch (err) {
    logger.warn("Komik API fallback failed", { mangaId, error: String(err) });
    return null;
  }
}

// ─── Cached List Endpoints (API-first + background cache warming) ───

/**
 * Homepage data with background cache warming.
 * Lists always fetch from external API (with ISR), but upsert items
 * to DB so that detail page cache hits are more likely.
 */
export async function getCachedHomepageData() {
  const [komikLatest, komikPopular, animeLatest, animeRecommended] = await Promise.all([
    getKomikLatest("mirror").catch(() => [] as Komik[]),
    getKomikPopular(1).catch(() => [] as Komik[]),
    getAnimeLatest().catch(() => [] as Anime[]),
    getAnimeRecommended(1).catch(() => [] as Anime[]),
  ]);

  // Warm DB cache in background (fire-and-forget)
  warmAnimeCacheInBackground([...animeLatest, ...animeRecommended]);
  warmKomikCacheInBackground([...komikLatest, ...komikPopular]);

  return {
    komikLatest,
    komikPopular,
    animeLatest,
    animeRecommended,
  };
}

// ─── Re-exports for convenience ─────────────────────────────────────
// These don't need DB caching (too dynamic or already ISR-cached)

export { getKomikChapterList } from "./api-client";
export { searchAnime, searchKomik, getKomikImages } from "./api-client";
export { getAnimeMovie, getAnimeLatest, getAnimeRecommended } from "./api-client";
export { getKomikLatest, getKomikPopular, getKomikRecommended } from "./api-client";
