/**
 * Cached API Layer (Server-only)
 *
 * DB-first caching strategy with observability:
 *  1. Check DB cache (with TTL via lastScraped)
 *  2. If fresh cache hit -> return mapped data
 *  3. If miss/stale -> fetch from external API
 *  4. Upsert result to DB cache (fire-and-forget for lists)
 *  5. Return data
 *
 * Metrics tracked via Azure App Insights:
 *  - Cache hit/miss per tier (DB, API, stale)
 *  - Per-tier latency (durationMs)
 *  - API errors and stale fallback usage
 *
 * For detail pages: full DB-first caching with TTL
 * For list pages: fetch from API, warm DB cache in background
 */

import "server-only";

import type { Anime, Komik, KomikChapter } from "@/types";
import { CACHE_TIMES } from "./cache-config";
import {
  extractEpisodeNumber,
  getAnimeDetail,
  getAnimeLatest,
  getAnimeRecommended,
  getKomikDetail,
  getKomikLatest,
  getKomikPopular,
} from "./api";
import {
  findCachedAnime,
  upsertCachedAnime,
  findCachedKomik,
  upsertCachedKomik,
  getKomikGenresBatch,
  getAnimeGenresBatch,
} from "./db";
import { isDatabaseConfigured } from "./prisma";
import { logger } from "./logger";
import { trackCacheEvent, trackEvent } from "./analytics";

// ─── Type Mappers: DB -> App Types ──────────────────────────────────

type DbAnime = NonNullable<Awaited<ReturnType<typeof findCachedAnime>>>;
type DbKomik = NonNullable<Awaited<ReturnType<typeof findCachedKomik>>>;

function mapDbAnimeToApp(db: DbAnime): Anime {
  const genres = Array.isArray(db.genres) ? (db.genres as string[]) : [];
  const episodes = Array.isArray(db.episodes)
    ? (
        db.episodes as Array<{
          title?: string;
          episodeId?: string;
          url?: string;
          date?: string;
        }>
      )
        .map((ep) => {
          // Sanitize: old DB records may contain full paths like
          // "/anime/episode/slug" — extract only the bare slug.
          const rawUrl = ep.url || ep.episodeId || "";
          const slug = rawUrl.includes("/")
            ? rawUrl.split("/").filter(Boolean).pop() || ""
            : rawUrl;
          return {
            episodeId: slug,
            title: ep.title || "",
            url: slug,
            date: ep.date,
          };
        })
        .filter((ep) => ep.url !== "")
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
      )
        .map((ch) => ({
          chapter_id: ch.chapter_id || ch.id || "",
          title: ch.title || `Chapter ${ch.chapter || ch.chapter_number}`,
          chapter: ch.chapter || ch.chapter_number,
          date: ch.date || ch.created_at,
        }))
        .filter((ch) => ch.chapter_id !== "")
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
 * Get anime detail with two-tier caching: DB -> External API.
 * TTL = CACHE_TIMES.DETAIL (30 minutes).
 *
 * Metrics tracked:
 * - cache_hit (db tier): DB cache was fresh
 * - cache_miss: Neither cache had fresh data
 * - cache_stale: API failed, served expired DB cache
 * - api_error: External API call failed
 */
export async function getCachedAnimeDetail(urlId: string): Promise<Anime | null> {
  const requestStart = Date.now();

  // L1: Supabase DB cache
  if (isDatabaseConfigured()) {
    const dbStart = Date.now();
    try {
      const cached = await findCachedAnime(urlId, CACHE_TIMES.DETAIL);
      if (cached) {
        logger.debug("Anime DB cache hit", { urlId, durationMs: Date.now() - dbStart });
        trackCacheEvent("cache_hit", "db", "anime", urlId, dbStart);
        return mapDbAnimeToApp(cached);
      }
      logger.debug("Anime cache miss", { urlId, durationMs: Date.now() - dbStart });
      trackCacheEvent("cache_miss", "db", "anime", urlId, dbStart);
    } catch (err) {
      logger.warn("Anime DB cache read failed, falling back to API", {
        urlId,
        error: String(err),
        durationMs: Date.now() - dbStart,
      });
      trackEvent({
        type: "db_error",
        contentType: "anime",
        contentId: urlId,
        durationMs: Date.now() - dbStart,
        context: "findCachedAnime",
      });
    }
  }

  // L2: External API
  const apiStart = Date.now();
  try {
    const anime = await getAnimeDetail(urlId);

    // Track successful API call
    trackEvent({
      type: "api_success",
      cacheTier: "api",
      contentType: "anime",
      contentId: urlId,
      durationMs: Date.now() - apiStart,
    });

    // Write back to DB cache (fire-and-forget)
    if (anime && isDatabaseConfigured()) {
      upsertCachedAnime(mapAppAnimeToDb(anime)).catch((err) => {
        logger.debug("Failed to write anime DB cache", { urlId, error: String(err) });
      });
    }

    logger.debug("Anime fetched from API", {
      urlId,
      durationMs: Date.now() - apiStart,
      totalMs: Date.now() - requestStart,
    });

    return anime;
  } catch (err) {
    const apiDuration = Date.now() - apiStart;
    logger.warn("Anime API fallback failed", {
      urlId,
      error: String(err),
      durationMs: apiDuration,
    });

    // Track API error
    trackEvent({
      type: "api_error",
      cacheTier: "api",
      contentType: "anime",
      contentId: urlId,
      durationMs: apiDuration,
      context: String(err),
    });

    // L3: Stale DB fallback — serve expired data rather than 404.
    // sankavollerei.com intermittently blocks Azure IPs with 403;
    // returning stale content is far better than showing "not found".
    if (isDatabaseConfigured()) {
      const staleStart = Date.now();
      try {
        const stale = await findCachedAnime(urlId);
        if (stale) {
          logger.info("Anime serving stale DB cache after API failure", {
            urlId,
            durationMs: Date.now() - staleStart,
            totalMs: Date.now() - requestStart,
          });
          trackCacheEvent("cache_stale", "stale", "anime", urlId, staleStart);
          return mapDbAnimeToApp(stale);
        }
      } catch {
        // DB also failed — truly nothing to serve
      }
    }

    return null;
  }
}

// Reject IDs that are clearly not valid API slugs — UUIDs from stale
// bookmark/history records and reserved route segments that leak into [mangaId].
const INVALID_SLUG_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-|^(genre|search|berwarna|pustaka)$/;

/**
 * Get komik detail with two-tier caching: DB -> External API.
 * TTL = CACHE_TIMES.DETAIL (30 minutes).
 *
 * Metrics tracked:
 * - cache_hit (db tier): DB cache was fresh
 * - cache_miss: Neither cache had fresh data
 * - cache_stale: API failed, served expired DB cache
 * - api_error: External API call failed
 */
export async function getCachedKomikDetail(mangaId: string): Promise<Komik | null> {
  if (INVALID_SLUG_RE.test(mangaId)) {
    logger.debug("Komik skipped — invalid slug", { mangaId });
    return null;
  }

  const requestStart = Date.now();

  // L1: Supabase DB cache
  if (isDatabaseConfigured()) {
    const dbStart = Date.now();
    try {
      const cached = await findCachedKomik(mangaId, CACHE_TIMES.DETAIL);
      if (cached) {
        logger.debug("Komik DB cache hit", { mangaId, durationMs: Date.now() - dbStart });
        trackCacheEvent("cache_hit", "db", "komik", mangaId, dbStart);
        return mapDbKomikToApp(cached);
      }
      logger.debug("Komik cache miss", { mangaId, durationMs: Date.now() - dbStart });
      trackCacheEvent("cache_miss", "db", "komik", mangaId, dbStart);
    } catch (err) {
      logger.warn("Komik DB cache read failed, falling back to API", {
        mangaId,
        error: String(err),
        durationMs: Date.now() - dbStart,
      });
      trackEvent({
        type: "db_error",
        contentType: "komik",
        contentId: mangaId,
        durationMs: Date.now() - dbStart,
        context: "findCachedKomik",
      });
    }
  }

  // L2: External API
  const apiStart = Date.now();
  try {
    const komik = await getKomikDetail(mangaId);

    // Track successful API call
    trackEvent({
      type: "api_success",
      cacheTier: "api",
      contentType: "komik",
      contentId: mangaId,
      durationMs: Date.now() - apiStart,
    });

    // Write back to DB cache (fire-and-forget)
    if (komik && isDatabaseConfigured()) {
      upsertCachedKomik(mapAppKomikToDb(komik)).catch((err) => {
        logger.debug("Failed to write komik DB cache", { mangaId, error: String(err) });
      });
    }

    logger.debug("Komik fetched from API", {
      mangaId,
      durationMs: Date.now() - apiStart,
      totalMs: Date.now() - requestStart,
    });

    return komik;
  } catch (err) {
    const apiDuration = Date.now() - apiStart;
    logger.warn("Komik API fallback failed", {
      mangaId,
      error: String(err),
      durationMs: apiDuration,
    });

    // Track API error
    trackEvent({
      type: "api_error",
      cacheTier: "api",
      contentType: "komik",
      contentId: mangaId,
      durationMs: apiDuration,
      context: String(err),
    });

    // L3: Stale DB fallback — serve expired data rather than 404.
    // sankavollerei.com intermittently blocks Azure IPs with 403;
    // returning stale content is far better than showing "not found".
    if (isDatabaseConfigured()) {
      const staleStart = Date.now();
      try {
        const stale = await findCachedKomik(mangaId);
        if (stale) {
          logger.info("Komik serving stale DB cache after API failure", {
            mangaId,
            durationMs: Date.now() - staleStart,
            totalMs: Date.now() - requestStart,
          });
          trackCacheEvent("cache_stale", "stale", "komik", mangaId, staleStart);
          return mapDbKomikToApp(stale);
        }
      } catch {
        // DB also failed — truly nothing to serve
      }
    }

    return null;
  }
}

// ─── Cached List Endpoints (API-first + background cache warming) ───

/**
 * Enrich komik list items with genres from DB cache.
 * Items without cached genres will have empty genres array.
 */
export async function enrichKomikWithGenres(items: Komik[]): Promise<Komik[]> {
  if (!isDatabaseConfigured() || items.length === 0) return items;

  try {
    const mangaIds = items.map((k) => k.manga_id);
    const genresMap = await getKomikGenresBatch(mangaIds);

    return items.map((item) => ({
      ...item,
      genres: genresMap.get(item.manga_id) ?? item.genres ?? [],
    }));
  } catch (err) {
    logger.debug("Failed to enrich komik with genres", { error: String(err) });
    return items;
  }
}

/**
 * Enrich anime list items with genres from DB cache.
 * Items without cached genres will have empty genres array.
 */
export async function enrichAnimeWithGenres(items: Anime[]): Promise<Anime[]> {
  if (!isDatabaseConfigured() || items.length === 0) return items;

  try {
    const urlIds = items.map((a) => a.urlId);
    const genresMap = await getAnimeGenresBatch(urlIds);

    return items.map((item) => ({
      ...item,
      genres: genresMap.get(item.urlId) ?? item.genres ?? [],
    }));
  } catch (err) {
    logger.debug("Failed to enrich anime with genres", { error: String(err) });
    return items;
  }
}

/**
 * Homepage data with background cache warming.
 * Lists always fetch from external API (with ISR), but upsert items
 * to DB so that detail page cache hits are more likely.
 */
export async function getCachedHomepageData() {
  const start = Date.now();

  const [komikLatest, komikPopular, animeLatest, animeRecommended] = await Promise.all([
    getKomikLatest("mirror").catch(() => [] as Komik[]),
    getKomikPopular(1).catch(() => [] as Komik[]),
    getAnimeLatest().catch(() => [] as Anime[]),
    getAnimeRecommended(1).catch(() => [] as Anime[]),
  ]);

  // Track homepage fetch performance
  trackEvent({
    type: "api_success",
    contentType: "homepage",
    durationMs: Date.now() - start,
    context: `komik:${komikLatest.length + komikPopular.length},anime:${animeLatest.length + animeRecommended.length}`,
  });

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

// ─── Cached Chapter List ───────────────────────────────────────────

/**
 * Get chapter list from cached detail data.
 * Avoids a separate uncached API call when the detail is already in DB/KV.
 * Falls back to the direct API via getCachedKomikDetail's 3-tier strategy.
 */
export async function getCachedKomikChapterList(mangaId: string): Promise<KomikChapter[]> {
  const komik = await getCachedKomikDetail(mangaId);
  return komik?.chapters ?? [];
}

// ─── Re-exports for convenience ─────────────────────────────────────
// These don't need DB caching (too dynamic or already ISR-cached)

export { getKomikChapterList } from "./api";
export { searchAnime, searchKomik, getKomikImages, getKomikChapterData } from "./api";
export { getAnimeMovie, getAnimeLatest, getAnimeRecommended } from "./api";
export { getKomikLatest, getKomikPopular, getKomikRecommended } from "./api";
