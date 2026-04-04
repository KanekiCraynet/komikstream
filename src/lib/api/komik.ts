/**
 * Komik API — sankavollerei.com Komiku Source
 *
 * Functions to fetch comic/manga data including listings, details,
 * chapters, images, search, and catalog endpoints.
 */

import type { Komik, KomikChapter, KomikChapterData, KomikImage, PaginatedResult } from "@/types";
import { CACHE_TIMES } from "@/lib/cache-config";
import { BASE_URL, COMIC_HEADERS } from "./constants";
import { fetchWithCache, ensureArray } from "./fetch";
import {
  transformComicListItem,
  transformComicCatalogItem,
  transformComicSearchItem,
  transformComicDetail,
  transformComicChapter,
  extractMangaSlugFromChapter,
} from "./transformers/komik";
import type {
  RawComicListItem,
  RawComicSearchItem,
  RawComicDetailData,
  RawComicChapterData,
  RawComicCatalogItem,
  RawComicPaginatedResponse,
  RawComicScrollResponse,
} from "./types";

// ==================== KOMIK LIST ENDPOINTS ====================

/**
 * Fetch latest comics.
 *
 * @param _type - Legacy parameter (ignored, API no longer differentiates)
 */
export async function getKomikLatest(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy API signature
  _type?: "project" | "mirror"
): Promise<Komik[]> {
  const res = await fetchWithCache<{ comics?: RawComicListItem[] }>(
    `${BASE_URL}/comic/terbaru`,
    CACHE_TIMES.LATEST,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.comics).map(transformComicListItem);
}

/**
 * Fetch popular comics.
 *
 * @param page - Page number for pagination
 */
export async function getKomikPopular(page: number = 1): Promise<Komik[]> {
  const res = await fetchWithCache<{ comics?: RawComicListItem[] }>(
    `${BASE_URL}/comic/populer${page > 1 ? `?page=${page}` : ""}`,
    CACHE_TIMES.POPULAR,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.comics).map(transformComicListItem);
}

/**
 * Fetch recommended comics.
 *
 * @param _type - Legacy parameter (ignored, API no longer filters by type)
 */
export async function getKomikRecommended(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy API signature
  _type?: "manhwa" | "manhua" | "manga"
): Promise<Komik[]> {
  const res = await fetchWithCache<{ recommendations?: RawComicListItem[] }>(
    `${BASE_URL}/comic/recommendations`,
    CACHE_TIMES.POPULAR,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.recommendations).map(transformComicListItem);
}

/**
 * Fetch colored comics (berwarna).
 *
 * @param page - Page number for pagination
 */
export async function getKomikBerwarna(page: number = 1): Promise<Komik[]> {
  const url = page > 1 ? `${BASE_URL}/comic/berwarna/${page}` : `${BASE_URL}/comic/berwarna`;
  const res = await fetchWithCache<{ data?: { results?: RawComicCatalogItem[] } }>(
    url,
    CACHE_TIMES.POPULAR,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.data?.results).map(transformComicCatalogItem);
}

/**
 * Fetch library comics (pustaka).
 *
 * @param page - Page number for pagination
 */
export async function getKomikPustaka(page: number = 1): Promise<Komik[]> {
  const url = page > 1 ? `${BASE_URL}/comic/pustaka/${page}` : `${BASE_URL}/comic/pustaka`;
  const res = await fetchWithCache<{ results?: RawComicCatalogItem[] }>(
    url,
    CACHE_TIMES.POPULAR,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.results).map(transformComicCatalogItem);
}

// ==================== KOMIK DETAIL ====================

/**
 * Fetch comic detail by manga ID (slug).
 *
 * @param mangaId - The manga identifier/slug
 * @returns Komik object with chapters, or null if not found
 */
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
 *
 * @param mangaId - The manga identifier/slug
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

// ==================== KOMIK SEARCH ====================

/**
 * Search comics by query string.
 *
 * @param query - Search term
 * @returns Array of matching comics
 */
export async function searchKomik(query: string): Promise<Komik[]> {
  const res = await fetchWithCache<{ data?: RawComicSearchItem[] }>(
    `${BASE_URL}/comic/search?q=${encodeURIComponent(query)}`,
    CACHE_TIMES.SEARCH,
    1,
    COMIC_HEADERS
  );
  return ensureArray(res.data).map(transformComicSearchItem);
}

/**
 * Advanced search parameters.
 */
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

/**
 * Advanced search with filters.
 *
 * @param params - Search parameters
 */
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

// ==================== KOMIK GENRE ====================

/**
 * Fetch comics by genre with pagination.
 *
 * @param genre - Genre slug
 * @param page - Page number
 */
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

// ==================== KOMIK CHAPTER & IMAGES ====================

/**
 * Fetch chapter images.
 *
 * @param chapterId - Chapter identifier/slug
 * @returns Array of image URLs with page numbers
 */
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

/**
 * Fetch full chapter data including manga info and navigation.
 *
 * Used for the /chapter/[chapterId] route where mangaId is not in the URL.
 *
 * @param chapterId - Chapter identifier/slug
 */
export async function getKomikChapterData(chapterId: string): Promise<KomikChapterData | null> {
  try {
    const res = await fetchWithCache<RawComicChapterData>(
      `${BASE_URL}/comic/chapter/${chapterId}`,
      CACHE_TIMES.IMAGES,
      1,
      COMIC_HEADERS
    );

    if (!res || !res.manga_title) {
      return null;
    }

    const mangaSlug = extractMangaSlugFromChapter(chapterId, res.manga_title);
    const imageUrls = ensureArray(res?.images);

    return {
      mangaTitle: res.manga_title,
      mangaSlug,
      chapterTitle: res.chapter_title || `Chapter`,
      navigation: {
        previousChapter: res.navigation?.previousChapter || null,
        nextChapter: res.navigation?.nextChapter || null,
      },
      images: imageUrls.map((url: string, index: number) => ({
        url,
        page: index + 1,
      })),
    };
  } catch (err) {
    console.warn(`[api-client] getKomikChapterData failed for ${chapterId}:`, err);
    return null;
  }
}

// ==================== KOMIK UNLIMITED / REALTIME / SCROLL ====================

/**
 * Deep crawl all comics (unlimited).
 *
 * **Server-only** — for cache warming jobs.
 * Never use aggressive=true in Worker request paths.
 *
 * @param params - Optional filter parameters
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

/**
 * Fetch realtime/fresh comics.
 *
 * @param params - Optional filter parameters
 */
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

/**
 * Fetch comics with infinite scroll pagination.
 *
 * @param params - Scroll parameters (offset, batch_size, seed, type)
 */
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
