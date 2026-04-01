/**
 * API Client — sankavollerei.com Provider
 *
 * Fetches anime (Otakudesu source) and comic (Komiku source) data from
 * https://www.sankavollerei.com. Safe to use in both client and server components.
 *
 * The API has a bot detector ("Plana AI Detector") that blocks requests without
 * browser-like headers, so every fetch includes User-Agent / Referer / etc.
 *
 * ISR is handled at the ROUTE level via `export const revalidate = N` in each page.
 */

import type {
  Anime,
  AnimeGenre,
  AnimeScheduleDay,
  AnimeBatchDownload,
  Komik,
  KomikChapter,
  KomikImage,
  PaginatedResult,
} from "@/types";
import { CACHE_TIMES } from "./cache-config";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://www.sankavollerei.com";

// ==================== BROWSER-LIKE HEADERS ====================
// Required to bypass the Plana AI Detector on sankavollerei.com

const ANIME_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://www.sankavollerei.com/anime/",
  "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
};

const COMIC_HEADERS: Record<string, string> = {
  ...ANIME_HEADERS,
  Referer: "https://www.sankavollerei.com/comic",
};

// ==================== RAW API TYPES ====================

// --- Anime (Otakudesu source) ---

interface RawAnimeListItem {
  title?: string;
  poster?: string;
  episodes?: number | null;
  releaseDay?: string;
  latestReleaseDate?: string;
  animeId?: string;
  href?: string;
  otakudesuUrl?: string;
  // search results include these:
  status?: string;
  score?: string;
  genreList?: RawGenreItem[];
}

interface RawGenreItem {
  title: string;
  genreId: string;
  href?: string;
  otakudesuUrl?: string;
}

interface RawAnimeDetailData {
  title?: string;
  poster?: string;
  japanese?: string;
  score?: string;
  producers?: string;
  type?: string;
  status?: string;
  episodes?: number | null;
  duration?: string;
  aired?: string;
  studios?: string;
  batch?: unknown;
  synopsis?: { paragraphs?: string[]; connections?: unknown[] };
  genreList?: RawGenreItem[];
  episodeList?: RawEpisodeListItem[];
  recommendedAnimeList?: RawAnimeListItem[];
}

interface RawEpisodeListItem {
  title?: string;
  eps?: number;
  date?: string;
  episodeId?: string;
  href?: string;
  otakudesuUrl?: string;
}

interface RawAnimeResponse<T> {
  status?: string;
  creator?: string;
  statusCode?: number;
  ok?: boolean;
  data?: T;
  pagination?: {
    currentPage?: number;
    hasPrevPage?: boolean;
    hasNextPage?: boolean;
    nextPage?: number | null;
    totalPages?: number;
  } | null;
}

// --- Anime Episode & Server ---

interface RawServerItem {
  title?: string;
  serverId?: string;
  href?: string;
}

interface RawQualityItem {
  title?: string;
  serverList?: RawServerItem[];
}

interface RawEpisodeData {
  title?: string;
  animeId?: string;
  releaseTime?: string;
  defaultStreamingUrl?: string;
  hasPrevEpisode?: boolean;
  prevEpisode?: { episodeId?: string } | null;
  hasNextEpisode?: boolean;
  nextEpisode?: { episodeId?: string } | null;
  server?: {
    qualities?: RawQualityItem[];
  };
  downloadUrl?: {
    qualities?: Array<{
      title?: string;
      size?: string;
      urls?: Array<{ title?: string; url?: string }>;
    }>;
  };
  info?: {
    credit?: string;
    encoder?: string;
    duration?: string;
    type?: string;
    genreList?: RawGenreItem[];
    episodeList?: RawEpisodeListItem[];
  };
}

// --- Comic (Komiku source) ---

interface RawComicListItem {
  title?: string;
  link?: string;
  image?: string;
  chapter?: string;
  time_ago?: string;
}

interface RawComicSearchItem {
  title?: string;
  altTitle?: string | null;
  slug?: string;
  href?: string;
  thumbnail?: string;
  type?: string;
  genre?: string;
  description?: string;
}

interface RawComicGenreItem {
  name: string;
  slug: string;
  link?: string;
}

interface RawComicChapterItem {
  chapter?: string;
  slug?: string;
  link?: string;
  date?: string;
}

interface RawComicDetailData {
  creator?: string;
  slug?: string;
  title?: string;
  title_indonesian?: string;
  image?: string;
  synopsis?: string;
  synopsis_full?: string;
  summary?: string;
  background_story?: string;
  metadata?: {
    type?: string;
    author?: string;
    status?: string;
    concept?: string;
    age_rating?: string;
    reading_direction?: string;
  };
  genres?: RawComicGenreItem[];
  chapters?: RawComicChapterItem[];
  similar_manga?: Array<{
    title?: string;
    slug?: string;
    link?: string;
    image?: string;
    type?: string;
    description?: string;
  }>;
}

interface RawComicChapterData {
  creator?: string;
  manga_title?: string;
  chapter_title?: string;
  navigation?: {
    previousChapter?: string | null;
    nextChapter?: string | null;
    chapterList?: unknown;
  };
  images?: string[];
}

// --- Anime Schedule & Batch (new endpoints) ---

interface RawScheduleDay {
  day?: string;
  anime_list?: Array<{
    title?: string;
    slug?: string;
    url?: string;
    poster?: string;
  }>;
}

interface RawScheduleResponse {
  data?: RawScheduleDay[];
}

interface RawBatchQuality {
  title?: string;
  size?: string;
  urls?: Array<{ title?: string; url?: string }>;
}

interface RawBatchData {
  title?: string;
  batchList?: Array<{
    title?: string;
    qualities?: RawBatchQuality[];
  }>;
}

// --- Comic Catalog Items (berwarna, pustaka) ---
// These endpoints return a different shape than the list endpoints.

interface RawComicCatalogItem {
  title?: string;
  thumbnail?: string;
  type?: string;
  genre?: string;
  url?: string;
  detailUrl?: string;
  description?: string;
  stats?: string;
  firstChapter?: { title?: string; url?: string };
  latestChapter?: { title?: string; url?: string };
}

// --- Comic Genre/Advanced Search (new endpoints) ---

interface RawComicPaginatedResponse {
  comics?: RawComicListItem[];
  pagination?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    total_on_page?: number;
    has_more?: boolean;
  };
}

interface RawComicScrollResponse {
  comics?: RawComicListItem[];
  next_offset?: number | null;
  has_more?: boolean;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Fetch JSON from the external API with retry logic and browser-like headers.
 */
async function fetchWithCache<T>(
  url: string,
  revalidate: number,
  retries = 1,
  headers: Record<string, string> = ANIME_HEADERS
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers, next: { revalidate } });

      if (res.status === 429) {
        const waitTime = Math.min(500 * Math.pow(2, i), 3000);
        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error("API rate limited (429)");
      }

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      return res.json();
    } catch (error) {
      if (i === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  throw new Error("Failed to fetch");
}

function ensureArray<T>(data: T | T[] | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [];
}

// ==================== ANIME HELPERS ====================

/**
 * Extract episode number from a title string.
 * Handles "Episode 10", "Ep. 10.5", etc.
 */
export function extractEpisodeNumber(text: string): number {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

// ==================== ANIME API ====================

export async function getAnimeLatest(): Promise<Anime[]> {
  const res = await fetchWithCache<RawAnimeResponse<{ animeList?: RawAnimeListItem[] }>>(
    `${BASE_URL}/anime/ongoing-anime`,
    CACHE_TIMES.LATEST
  );
  return ensureArray(res.data?.animeList).map(transformAnimeListItem);
}

export async function getAnimeRecommended(page: number = 1): Promise<Anime[]> {
  // The home endpoint returns ongoing + completed sections
  const res = await fetchWithCache<
    RawAnimeResponse<{
      ongoing?: { animeList?: RawAnimeListItem[] };
      completed?: { animeList?: RawAnimeListItem[] };
    }>
  >(`${BASE_URL}/anime/home`, CACHE_TIMES.POPULAR);

  const ongoing = ensureArray(res.data?.ongoing?.animeList);
  const completed = ensureArray(res.data?.completed?.animeList);
  // Merge both lists — use page param to offset (20 items per page)
  const all = [...ongoing, ...completed];
  const perPage = 20;
  const start = (page - 1) * perPage;
  return all.slice(start, start + perPage).map(transformAnimeListItem);
}

export async function getAnimeMovie(): Promise<Anime[]> {
  // sankavollerei.com default source doesn't have a dedicated movie endpoint.
  // Use the complete-anime list as a reasonable fallback.
  const res = await fetchWithCache<RawAnimeResponse<{ animeList?: RawAnimeListItem[] }>>(
    `${BASE_URL}/anime/complete-anime`,
    CACHE_TIMES.POPULAR
  );
  return ensureArray(res.data?.animeList).map(transformAnimeListItem);
}

export async function getAnimeDetail(urlId: string): Promise<Anime | null> {
  const res = await fetchWithCache<RawAnimeResponse<RawAnimeDetailData>>(
    `${BASE_URL}/anime/anime/${urlId}`,
    CACHE_TIMES.DETAIL
  );
  const detail = res.data;
  return detail?.title ? transformAnimeDetail(detail, urlId) : null;
}

export async function searchAnime(query: string): Promise<Anime[]> {
  const res = await fetchWithCache<RawAnimeResponse<{ animeList?: RawAnimeListItem[] }>>(
    `${BASE_URL}/anime/search/${encodeURIComponent(query)}`,
    CACHE_TIMES.SEARCH
  );
  return ensureArray(res.data?.animeList).map(transformAnimeListItem);
}

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
 * Used by the video API route to get server list.
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
 */
export async function getAnimeServerUrl(serverId: string): Promise<string | null> {
  const res = await fetchWithCache<RawAnimeResponse<{ url?: string }>>(
    `${BASE_URL}/anime/server/${serverId}`,
    CACHE_TIMES.SEARCH
  );
  return res.data?.url || null;
}

// ==================== ANIME — NEW ENDPOINTS ====================

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

/**
 * Fetch all anime data. Server-only — for cache warming jobs.
 * Do NOT call from page request paths on Cloudflare Workers.
 */
export async function getAnimeUnlimited(): Promise<Anime[]> {
  const res = await fetchWithCache<RawAnimeResponse<{ animeList?: RawAnimeListItem[] }>>(
    `${BASE_URL}/anime/unlimited`,
    CACHE_TIMES.POPULAR
  );
  return ensureArray(res.data?.animeList).map(transformAnimeListItem);
}

// ==================== KOMIK API ====================

export async function getKomikLatest(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy API signature
  _type?: "project" | "mirror"
): Promise<Komik[]> {
  // The new API doesn't differentiate project/mirror — just returns latest
  const res = await fetchWithCache<{ comics?: RawComicListItem[] }>(
    `${BASE_URL}/comic/terbaru`,
    CACHE_TIMES.LATEST,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.comics).map(transformComicListItem);
}

export async function getKomikPopular(page: number = 1): Promise<Komik[]> {
  const res = await fetchWithCache<{ comics?: RawComicListItem[] }>(
    `${BASE_URL}/comic/populer${page > 1 ? `?page=${page}` : ""}`,
    CACHE_TIMES.POPULAR,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.comics).map(transformComicListItem);
}

export async function getKomikRecommended(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy API signature
  _type?: "manhwa" | "manhua" | "manga"
): Promise<Komik[]> {
  // The new API has /comic/recommendations without type filter.
  // Response shape: { recommendations: RawComicListItem[] }
  const res = await fetchWithCache<{ recommendations?: RawComicListItem[] }>(
    `${BASE_URL}/comic/recommendations`,
    CACHE_TIMES.POPULAR,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.recommendations).map(transformComicListItem);
}

export async function getKomikDetail(mangaId: string): Promise<Komik | null> {
  const res = await fetchWithCache<RawComicDetailData>(
    `${BASE_URL}/comic/comic/${mangaId}`,
    CACHE_TIMES.DETAIL,
    1,
    COMIC_HEADERS
  );
  return res?.title ? transformComicDetail(res) : null;
}

/**
 * Fetch the chapter list for a manga.
 *
 * With the new API, chapters are included in the detail response.
 * This function fetches the detail and extracts just the chapters.
 */
export async function getKomikChapterList(mangaId: string): Promise<KomikChapter[]> {
  try {
    const res = await fetchWithCache<RawComicDetailData>(
      `${BASE_URL}/comic/comic/${mangaId}`,
      CACHE_TIMES.DETAIL,
      1,
      COMIC_HEADERS
    );

    const chapters = ensureArray(res?.chapters)
      .map(transformComicChapter)
      .filter((ch) => ch.chapter_id !== "");

    // Sort ascending by chapter number
    return chapters.sort((a, b) => {
      const numA = typeof a.chapter === "number" ? a.chapter : parseFloat(String(a.chapter)) || 0;
      const numB = typeof b.chapter === "number" ? b.chapter : parseFloat(String(b.chapter)) || 0;
      return numA - numB;
    });
  } catch (err) {
    console.warn(`[api-client] getKomikChapterList failed for ${mangaId}:`, err);
    return [];
  }
}

export async function searchKomik(query: string): Promise<Komik[]> {
  const res = await fetchWithCache<{ data?: RawComicSearchItem[] }>(
    `${BASE_URL}/comic/search?q=${encodeURIComponent(query)}`,
    CACHE_TIMES.SEARCH,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.data).map(transformComicSearchItem);
}

export async function getKomikImages(chapterId: string): Promise<KomikImage[]> {
  const res = await fetchWithCache<RawComicChapterData>(
    `${BASE_URL}/comic/chapter/${chapterId}`,
    CACHE_TIMES.IMAGES,
    1,
    COMIC_HEADERS
  );
  const imageUrls = ensureArray(res?.images);
  return imageUrls.map((url: string, index: number) => ({
    url,
    page: index + 1,
  }));
}

// ==================== KOMIK — NEW ENDPOINTS ====================

export async function getKomikBerwarna(page: number = 1): Promise<Komik[]> {
  const url = page > 1 ? `${BASE_URL}/comic/berwarna/${page}` : `${BASE_URL}/comic/berwarna`;
  // Response shape: { data: { results: RawComicCatalogItem[] } }
  const res = await fetchWithCache<{ data?: { results?: RawComicCatalogItem[] } }>(
    url,
    CACHE_TIMES.POPULAR,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.data?.results).map(transformComicCatalogItem);
}

export async function getKomikPustaka(page: number = 1): Promise<Komik[]> {
  const url = page > 1 ? `${BASE_URL}/comic/pustaka/${page}` : `${BASE_URL}/comic/pustaka`;
  // Response shape: { results: RawComicCatalogItem[] }
  const res = await fetchWithCache<{ results?: RawComicCatalogItem[] }>(
    url,
    CACHE_TIMES.POPULAR,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.results).map(transformComicCatalogItem);
}

export async function getKomikByGenre(
  genre: string,
  page: number = 1
): Promise<PaginatedResult<Komik>> {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  params.set("limit", "20");
  const qs = params.toString();
  const res = await fetchWithCache<RawComicPaginatedResponse>(
    `${BASE_URL}/comic/genre/${encodeURIComponent(genre)}${qs ? `?${qs}` : ""}`,
    CACHE_TIMES.POPULAR,
    1,
    COMIC_HEADERS
  );
  return {
    items: ensureArray(res.comics).map(transformComicListItem),
    hasNextPage: res.pagination?.has_more ?? false,
    totalPages: Math.ceil((res.pagination?.total ?? 0) / (res.pagination?.per_page ?? 20)) || 1,
  };
}

export interface KomikAdvancedSearchParams {
  q?: string;
  type?: string;
  status?: string;
  genre?: string;
  year?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function advancedSearchKomik(
  params: KomikAdvancedSearchParams
): Promise<PaginatedResult<Komik>> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.type && params.type !== "all") sp.set("type", params.type);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.genre && params.genre !== "all") sp.set("genre", params.genre);
  if (params.year && params.year !== "all") sp.set("year", params.year);
  if (params.sort && params.sort !== "relevance") sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));

  const res = await fetchWithCache<{
    data?: RawComicSearchItem[];
    pagination?: RawComicPaginatedResponse["pagination"];
  }>(`${BASE_URL}/comic/advanced-search?${sp.toString()}`, CACHE_TIMES.SEARCH, 1, COMIC_HEADERS);
  return {
    items: ensureArray(res.data).map(transformComicSearchItem),
    hasNextPage: res.pagination?.has_more ?? false,
    totalPages: Math.ceil((res.pagination?.total ?? 0) / (res.pagination?.per_page ?? 20)) || 1,
  };
}

/**
 * Deep crawl all comics. Server-only — for cache warming.
 * Never use aggressive=true in Worker request paths.
 */
export async function getKomikUnlimited(params?: {
  type?: string;
  max_pages?: number;
  aggressive?: boolean;
}): Promise<Komik[]> {
  const sp = new URLSearchParams();
  if (params?.type) sp.set("type", params.type);
  if (params?.max_pages) sp.set("max_pages", String(params.max_pages));
  if (params?.aggressive) sp.set("aggressive", "true");
  const qs = sp.toString();

  const res = await fetchWithCache<{ comics?: RawComicListItem[] }>(
    `${BASE_URL}/comic/unlimited${qs ? `?${qs}` : ""}`,
    CACHE_TIMES.POPULAR,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.comics).map(transformComicListItem);
}

export async function getKomikRealtime(params?: {
  count?: number;
  fresh?: boolean;
  categories?: string;
  randomize?: boolean;
}): Promise<Komik[]> {
  const sp = new URLSearchParams();
  if (params?.count) sp.set("count", String(params.count));
  if (params?.fresh) sp.set("fresh", "true");
  if (params?.categories) sp.set("categories", params.categories);
  if (params?.randomize) sp.set("randomize", "true");
  const qs = sp.toString();

  const res = await fetchWithCache<{ comics?: RawComicListItem[] }>(
    `${BASE_URL}/comic/realtime${qs ? `?${qs}` : ""}`,
    0, // no cache — fresh data
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.comics).map(transformComicListItem);
}

export async function getKomikScroll(params?: {
  offset?: number;
  batch_size?: number;
  seed?: string;
  type?: string;
}): Promise<{ items: Komik[]; nextOffset: number | null }> {
  const sp = new URLSearchParams();
  if (params?.offset) sp.set("offset", String(params.offset));
  if (params?.batch_size) sp.set("batch_size", String(params.batch_size));
  if (params?.seed) sp.set("seed", params.seed);
  if (params?.type) sp.set("type", params.type);
  const qs = sp.toString();

  const res = await fetchWithCache<RawComicScrollResponse>(
    `${BASE_URL}/comic/scroll${qs ? `?${qs}` : ""}`,
    CACHE_TIMES.LATEST,
    1,
    COMIC_HEADERS
  );
  return {
    items: ensureArray(res.comics).map(transformComicListItem),
    nextOffset: res.has_more ? (res.next_offset ?? null) : null,
  };
}

// ==================== HOMEPAGE ====================

export async function getHomepageData() {
  const [komikLatest, komikPopular, animeLatest, animeRecommended] = await Promise.all([
    getKomikLatest().catch(() => []),
    getKomikPopular(1).catch(() => []),
    getAnimeLatest().catch(() => []),
    getAnimeRecommended(1).catch(() => []),
  ]);

  return {
    komikLatest,
    komikPopular,
    animeLatest,
    animeRecommended,
  };
}

// ==================== TRANSFORMERS ====================

// --- Anime Transformers ---

function transformAnimeListItem(raw: RawAnimeListItem): Anime {
  return {
    urlId: raw.animeId || "",
    title: raw.title || "",
    thumbnail: raw.poster || "",
    rating: raw.score || undefined,
    type: undefined,
    status: raw.status || undefined,
    genres: raw.genreList?.map((g) => g.title) || [],
    episodes: [],
  };
}

function transformAnimeDetail(raw: RawAnimeDetailData, urlId: string): Anime {
  const synopsis = raw.synopsis?.paragraphs?.join("\n\n") || undefined;

  // Sort ascending by episode number
  const episodes = ensureArray(raw.episodeList)
    .map((ep) => {
      // The upstream API may return episodeId as a full path like
      // "/anime/episode/sdhm-episode-1-sub-indo" — extract only the bare slug
      // to avoid broken URLs when interpolated into /anime/watch/{animeUrlId}/{slug}
      const epSlug = (ep.episodeId || "").split("/").filter(Boolean).pop() || "";
      return {
        episodeId: epSlug,
        title: ep.title || `Episode ${ep.eps}`,
        episode: ep.eps,
        url: epSlug,
        date: ep.date || undefined,
      };
    })
    .sort((a, b) => extractEpisodeNumber(a.title) - extractEpisodeNumber(b.title));

  return {
    urlId,
    title: raw.title || "",
    thumbnail: raw.poster || "",
    cover: raw.poster || "",
    synopsis,
    rating: raw.score || undefined,
    type: raw.type || undefined,
    status: raw.status || undefined,
    genres: raw.genreList?.map((g) => g.title) || [],
    episodes,
    totalEpisodes: raw.episodes ?? undefined,
    duration: raw.duration || undefined,
    studio: raw.studios || undefined,
  };
}

// --- Comic Transformers ---

/**
 * Transform a comic list item (from /comic/terbaru, /comic/populer).
 * These items have minimal data — only title, image, link, chapter, time_ago.
 * We extract the slug from the link to use as manga_id.
 */
function transformComicListItem(raw: RawComicListItem): Komik {
  // Extract slug from link — handles both:
  //   "/manga/some-slug/"  (from /comic/terbaru)
  //   "https://komiku.org/manga/some-slug/"  (from /comic/populer)
  let slug = "";
  if (raw.link) {
    const match = raw.link.match(/\/manga\/([^/?#]+)/);
    slug = match ? match[1] : "";
  }

  return {
    manga_id: slug,
    title: raw.title || "",
    thumbnail: raw.image || "",
    latestChapter: raw.chapter || undefined,
    updatedAt: raw.time_ago || undefined,
  };
}

/**
 * Transform a catalog item (from /comic/berwarna, /comic/pustaka).
 * These use `url` (full komiku.org URL) instead of `link`, and include
 * type/genre/description metadata.
 */
function transformComicCatalogItem(raw: RawComicCatalogItem): Komik {
  let slug = "";
  if (raw.url) {
    const match = raw.url.match(/\/manga\/([^/?#]+)/);
    slug = match ? match[1] : "";
  }

  return {
    manga_id: slug,
    title: raw.title || "",
    thumbnail: raw.thumbnail || "",
    type: raw.type || undefined,
    genres: raw.genre ? [raw.genre] : [],
    description: raw.description || undefined,
    latestChapter: raw.latestChapter?.title || undefined,
  };
}

function transformComicSearchItem(raw: RawComicSearchItem): Komik {
  return {
    manga_id: raw.slug || "",
    title: raw.title || "",
    thumbnail: raw.thumbnail || "",
    type: raw.type || undefined,
    genres: raw.genre ? [raw.genre] : [],
    description: raw.description || undefined,
  };
}

function transformComicDetail(raw: RawComicDetailData): Komik {
  const chapters = ensureArray(raw.chapters)
    .map(transformComicChapter)
    .filter((ch) => ch.chapter_id !== "")
    .sort((a, b) => {
      const numA = typeof a.chapter === "number" ? a.chapter : parseFloat(String(a.chapter)) || 0;
      const numB = typeof b.chapter === "number" ? b.chapter : parseFloat(String(b.chapter)) || 0;
      return numA - numB;
    });

  return {
    manga_id: raw.slug || "",
    title: raw.title || "",
    thumbnail: raw.image || "",
    cover: raw.image || "",
    type: raw.metadata?.type || undefined,
    status: raw.metadata?.status || undefined,
    description: raw.synopsis_full || raw.synopsis || undefined,
    author: raw.metadata?.author !== "-" ? raw.metadata?.author : undefined,
    genres: raw.genres?.map((g) => g.name) || [],
    chapters,
    latestChapter: chapters.length > 0 ? chapters[chapters.length - 1]?.title : undefined,
  };
}

/**
 * Extract chapter number from a title like "Chapter 18".
 */
function extractChapterNumber(title: string): number {
  const match = title.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function transformComicChapter(raw: RawComicChapterItem): KomikChapter {
  return {
    chapter_id: raw.slug || "",
    title: raw.chapter || "",
    chapter: extractChapterNumber(raw.chapter || ""),
    date: raw.date || undefined,
  };
}
