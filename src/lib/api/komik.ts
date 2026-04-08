/**
 * Komik API — Sansekai Source
 *
 * Thin wrapper delegating to the Sansekai JSON API module.
 * Public signatures unchanged so all consumers keep working.
 */

import type { Komik, KomikChapter, KomikChapterData, KomikImage, PaginatedResult } from "@/types";
import {
  fetchKomikLatest,
  fetchKomikPopular,
  fetchKomikRecommended,
  fetchKomikSearch,
  fetchKomikDetail,
  fetchKomikChapterList,
  fetchKomikChapterData,
  fetchKomikImages,
  fetchKomikGenres as sansekaiGenres,
  fetchKomikByGenre,
  fetchKomikList,
} from "./sansekai/komik";

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

// ==================== KOMIK LIST ====================

export async function getKomikLatest(_type?: "project" | "mirror"): Promise<Komik[]> {
  return fetchKomikLatest(_type);
}

export async function getKomikPopular(page = 1): Promise<Komik[]> {
  return fetchKomikPopular(page);
}

export async function getKomikRecommended(type?: string): Promise<Komik[]> {
  return fetchKomikRecommended(type);
}

export async function getKomikBerwarna(_page = 1): Promise<Komik[]> {
  return [];
}

export async function getKomikPustaka(page = 1): Promise<Komik[]> {
  const { items } = await fetchKomikList({ page, sortby: "update" });
  return items;
}

// ==================== KOMIK DETAIL ====================

export async function getKomikDetail(mangaId: string): Promise<Komik | null> {
  return fetchKomikDetail(mangaId);
}

export async function getKomikChapterList(mangaId: string): Promise<KomikChapter[]> {
  return fetchKomikChapterList(mangaId);
}

// ==================== SEARCH ====================

export async function searchKomik(query: string): Promise<Komik[]> {
  return fetchKomikSearch(query);
}

export async function advancedSearchKomik(
  params: KomikAdvancedSearchParams
): Promise<PaginatedResult<Komik>> {
  // If query provided, use search endpoint
  if (params.q) {
    const results = await fetchKomikSearch(params.q);
    // Client-side filtering for type/status/genre
    const filtered = results.filter((k) => {
      if (
        params.type &&
        params.type !== "all" &&
        k.type?.toLowerCase() !== params.type.toLowerCase()
      )
        return false;
      if (
        params.status &&
        params.status !== "all" &&
        k.status?.toLowerCase() !== params.status.toLowerCase()
      )
        return false;
      if (
        params.genre &&
        params.genre !== "all" &&
        !k.genres?.some((g) => g.toLowerCase() === params.genre!.toLowerCase())
      )
        return false;
      return true;
    });
    return { items: filtered, hasNextPage: false, totalPages: 1 };
  }

  // No query — use list endpoint with pagination
  const sortby = params.sort === "popular" ? "popular" : "update";
  const { items, hasMore, totalPages } = await fetchKomikList({
    page: params.page ?? 1,
    sortby,
    type: params.type !== "all" ? params.type : undefined,
  });

  return { items, hasNextPage: hasMore, totalPages };
}

// ==================== GENRE ====================

export async function getKomikByGenre(genre: string, page = 1): Promise<PaginatedResult<Komik>> {
  return fetchKomikByGenre(genre, page);
}

// ==================== CHAPTER & IMAGES ====================

export async function getKomikImages(chapterId: string): Promise<KomikImage[]> {
  return fetchKomikImages(chapterId);
}

export async function getKomikChapterData(chapterId: string): Promise<KomikChapterData | null> {
  return fetchKomikChapterData(chapterId);
}

// ==================== CATALOG / SEEDING ====================

export async function getKomikUnlimited(params?: {
  type?: string;
  max_pages?: number;
}): Promise<Komik[]> {
  const maxPages = params?.max_pages ?? 3;
  const results: Komik[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const { items, hasMore } = await fetchKomikList({
      page,
      sortby: "update",
      type: params?.type,
    });
    results.push(...items);
    if (!hasMore) break;
  }
  return results;
}

export async function getKomikRealtime(_params?: {
  count?: number;
  fresh?: boolean;
}): Promise<Komik[]> {
  return fetchKomikLatest();
}

export async function getKomikScroll(params?: {
  offset?: number;
  batch_size?: number;
  seed?: string;
  type?: string;
}): Promise<{ items: Komik[]; nextOffset: number | null }> {
  const batchSize = params?.batch_size ?? 20;
  const offset = params?.offset ?? 0;
  const page = Math.floor(offset / batchSize) + 1;

  const { items, hasMore } = await fetchKomikList({ page, sortby: "update", type: params?.type });
  const nextOffset = hasMore ? offset + items.length : null;

  return { items, nextOffset };
}

// ==================== GENRES ====================

import type { KomikGenre } from "@/types";

export async function getKomikGenres(): Promise<KomikGenre[]> {
  return sansekaiGenres();
}
