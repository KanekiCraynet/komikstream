/**
 * Anime API — sankavollerei.com Otakudesu Source
 *
 * Functions to fetch anime data including listings, details, episodes,
 * schedule, genres, and batch downloads.
 */

import type {
  Anime,
  AnimeGenre,
  AnimeScheduleDay,
  AnimeBatchDownload,
  PaginatedResult,
} from "@/types";
import { CACHE_TIMES } from "@/lib/cache-config";
import { BASE_URL } from "./constants";
import { fetchWithCache, ensureArray } from "./fetch";
import {
  transformAnimeListItem,
  transformAnimeDetail,
  extractEpisodeNumber,
} from "./transformers/anime";
import type {
  RawAnimeResponse,
  RawAnimeListItem,
  RawAnimeDetailData,
  RawEpisodeData,
  RawGenreItem,
  RawScheduleResponse,
  RawBatchData,
} from "./types";

// Re-export for convenience
export { extractEpisodeNumber };

// ==================== ANIME LIST ENDPOINTS ====================

/**
 * Fetch latest/ongoing anime.
 */
export async function getAnimeLatest(): Promise<Anime[]> {
  const res = await fetchWithCache<RawAnimeResponse<{ animeList?: RawAnimeListItem[] }>>(
    `${BASE_URL}/anime/ongoing-anime`,
    CACHE_TIMES.LATEST
  );
  return ensureArray(res.data?.animeList).map(transformAnimeListItem);
}

/**
 * Fetch recommended anime (mix of ongoing + completed).
 *
 * @param page - Page number for pagination (20 items per page)
 */
export async function getAnimeRecommended(page: number = 1): Promise<Anime[]> {
  const res = await fetchWithCache<
    RawAnimeResponse<{
      ongoing?: { animeList?: RawAnimeListItem[] };
      completed?: { animeList?: RawAnimeListItem[] };
    }>
  >(`${BASE_URL}/anime/home`, CACHE_TIMES.POPULAR);

  const ongoing = ensureArray(res.data?.ongoing?.animeList);
  const completed = ensureArray(res.data?.completed?.animeList);
  const all = [...ongoing, ...completed];
  const perPage = 20;
  const start = (page - 1) * perPage;
  return all.slice(start, start + perPage).map(transformAnimeListItem);
}

/**
 * Fetch anime movies.
 *
 * Note: sankavollerei.com doesn't have a dedicated movie endpoint,
 * so this uses complete-anime as a fallback.
 */
export async function getAnimeMovie(): Promise<Anime[]> {
  const res = await fetchWithCache<RawAnimeResponse<{ animeList?: RawAnimeListItem[] }>>(
    `${BASE_URL}/anime/complete-anime`,
    CACHE_TIMES.POPULAR
  );
  return ensureArray(res.data?.animeList).map(transformAnimeListItem);
}

/**
 * Fetch all anime data (unlimited).
 *
 * **Server-only** — for cache warming jobs.
 * Do NOT call from page request paths on Cloudflare Workers.
 */
export async function getAnimeUnlimited(): Promise<Anime[]> {
  const res = await fetchWithCache<RawAnimeResponse<{ animeList?: RawAnimeListItem[] }>>(
    `${BASE_URL}/anime/unlimited`,
    CACHE_TIMES.POPULAR
  );
  return ensureArray(res.data?.animeList).map(transformAnimeListItem);
}

// ==================== ANIME DETAIL ====================

/**
 * Fetch anime detail by URL ID.
 *
 * @param urlId - The anime identifier (e.g., "one-piece-sub-indo")
 * @returns Anime object with episodes, or null if not found
 */
export async function getAnimeDetail(urlId: string): Promise<Anime | null> {
  const res = await fetchWithCache<RawAnimeResponse<RawAnimeDetailData>>(
    `${BASE_URL}/anime/anime/${urlId}`,
    CACHE_TIMES.DETAIL
  );
  const detail = res.data;
  return detail?.title ? transformAnimeDetail(detail, urlId) : null;
}

// ==================== ANIME SEARCH ====================

/**
 * Search anime by query string.
 *
 * @param query - Search term
 * @returns Array of matching anime
 */
export async function searchAnime(query: string): Promise<Anime[]> {
  const res = await fetchWithCache<RawAnimeResponse<{ animeList?: RawAnimeListItem[] }>>(
    `${BASE_URL}/anime/search/${encodeURIComponent(query)}`,
    CACHE_TIMES.SEARCH
  );
  return ensureArray(res.data?.animeList).map(transformAnimeListItem);
}

// ==================== ANIME VIDEO ====================

/**
 * Response from the internal anime video API proxy.
 */
export interface AnimeVideoResult {
  url: string | null;
  type: "direct" | "embed";
  availableResolutions: string[];
}

/**
 * Fetch anime video URL via the internal API proxy.
 *
 * **Client-only** — uses a relative URL (`/api/anime/video`) that requires
 * a browser context. Do NOT call this from server components.
 *
 * @param episodeId - Episode identifier
 * @param quality - Video quality (default: "480p")
 */
export async function getAnimeVideo(
  episodeId: string,
  quality: string = "480p"
): Promise<AnimeVideoResult> {
  try {
    const res = await fetch(
      `/api/anime/video?episodeId=${encodeURIComponent(episodeId)}&quality=${encodeURIComponent(quality)}`
    );
    if (!res.ok) return { url: null, type: "embed", availableResolutions: [] };
    const data = await res.json();
    return {
      url: data.url || null,
      type: data.type || "embed",
      availableResolutions: data.availableResolutions || [],
    };
  } catch {
    return { url: null, type: "embed", availableResolutions: [] };
  }
}

/**
 * Fetch anime episode data (server-side only).
 *
 * Used by the video API route to get server list.
 *
 * @param episodeId - Episode identifier
 */
export async function getAnimeEpisode(episodeId: string): Promise<RawEpisodeData | null> {
  const res = await fetchWithCache<RawAnimeResponse<RawEpisodeData>>(
    `${BASE_URL}/anime/episode/${episodeId}`,
    CACHE_TIMES.SEARCH
  );
  return res.data || null;
}

/**
 * Fetch a stream URL for a specific server (server-side only).
 *
 * @param serverId - Server identifier
 */
export async function getAnimeServerUrl(serverId: string): Promise<string | null> {
  const res = await fetchWithCache<RawAnimeResponse<{ url?: string }>>(
    `${BASE_URL}/anime/server/${serverId}`,
    CACHE_TIMES.SEARCH
  );
  return res.data?.url || null;
}

// ==================== ANIME SCHEDULE ====================

/**
 * Fetch anime release schedule by day.
 */
export async function getAnimeSchedule(): Promise<AnimeScheduleDay[]> {
  const res = await fetchWithCache<RawScheduleResponse>(
    `${BASE_URL}/anime/schedule`,
    CACHE_TIMES.POPULAR
  );
  return ensureArray(res.data).map((day) => ({
    day: day.day || "",
    animeList: ensureArray(day.anime_list).map((item) => ({
      title: item.title || "",
      slug: item.slug || "",
      url: item.url || "",
      poster: item.poster || "",
    })),
  }));
}

// ==================== ANIME GENRES ====================

/**
 * Fetch all anime genres.
 */
export async function getAnimeGenres(): Promise<AnimeGenre[]> {
  const res = await fetchWithCache<RawAnimeResponse<{ genreList?: RawGenreItem[] }>>(
    `${BASE_URL}/anime/genre`,
    CACHE_TIMES.STATIC
  );
  return ensureArray(res.data?.genreList).map((g) => ({
    title: g.title,
    genreId: g.genreId,
    href: g.href,
    otakudesuUrl: g.otakudesuUrl,
  }));
}

/**
 * Fetch anime by genre with pagination.
 *
 * @param slug - Genre slug
 * @param page - Page number
 */
export async function getAnimeByGenre(
  slug: string,
  page: number = 1
): Promise<PaginatedResult<Anime>> {
  const res = await fetchWithCache<RawAnimeResponse<{ animeList?: RawAnimeListItem[] }>>(
    `${BASE_URL}/anime/genre/${encodeURIComponent(slug)}${page > 1 ? `?page=${page}` : ""}`,
    CACHE_TIMES.POPULAR
  );
  return {
    items: ensureArray(res.data?.animeList).map(transformAnimeListItem),
    hasNextPage: res.pagination?.hasNextPage ?? false,
    totalPages: res.pagination?.totalPages ?? 1,
  };
}

// ==================== ANIME BATCH ====================

/**
 * Fetch batch download links for an anime.
 *
 * @param slug - Anime slug
 * @returns Batch download data or null if unavailable
 */
export async function getAnimeBatch(slug: string): Promise<AnimeBatchDownload | null> {
  try {
    const res = await fetchWithCache<RawAnimeResponse<RawBatchData>>(
      `${BASE_URL}/anime/batch/${encodeURIComponent(slug)}`,
      CACHE_TIMES.DETAIL
    );
    const data = res.data;
    if (!data) return null;

    return {
      title: data.title,
      batchList: ensureArray(data.batchList).map((batch) => ({
        title: batch.title || "",
        qualities: ensureArray(batch.qualities).map((q) => ({
          resolution: q.title || "",
          urls: ensureArray(q.urls).map((u) => ({
            host: u.title || "",
            url: u.url || "",
          })),
        })),
      })),
    };
  } catch {
    return null;
  }
}
