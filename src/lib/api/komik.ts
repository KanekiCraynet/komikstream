/**
 * Komik API — Komikcast Source
 *
 * All comic data is scraped directly from komikcast03.com.
 * Replaces the previous sankavollerei.com JSON API.
 */

import type { Komik, KomikChapter, KomikChapterData, KomikImage, PaginatedResult } from "@/types";
import {
  getLatestKomik,
  getPopularKomik,
  getKomikList,
  searchKomik as scrapeSearchKomik,
  getKomikDetail as scrapeKomikDetail,
  getKomikChapterList as scrapeChapterList,
  getKomikChapterData as scrapeChapterData,
  getKomikImages as scrapeImages,
  getKomikGenres as scrapeGenres,
  getKomikByGenre as scrapeByGenre,
} from "./scrapers/komikcast";

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
  return getLatestKomik();
}

export async function getKomikPopular(page = 1): Promise<Komik[]> {
  return getPopularKomik(page);
}

export async function getKomikRecommended(_type?: string): Promise<Komik[]> {
  // No dedicated recommendations endpoint — use popular list
  return getPopularKomik(1);
}

export async function getKomikBerwarna(_page = 1): Promise<Komik[]> {
  // Komikcast doesn't have a colored comics section — return empty
  return [];
}

export async function getKomikPustaka(page = 1): Promise<Komik[]> {
  const { items } = await getKomikList({ page, sortby: "update" });
  return items;
}

// ==================== KOMIK DETAIL ====================

export async function getKomikDetail(mangaId: string): Promise<Komik | null> {
  return scrapeKomikDetail(mangaId);
}

export async function getKomikChapterList(mangaId: string): Promise<KomikChapter[]> {
  return scrapeChapterList(mangaId);
}

// ==================== SEARCH ====================

export async function searchKomik(query: string): Promise<Komik[]> {
  return scrapeSearchKomik(query);
}

export async function advancedSearchKomik(
  params: KomikAdvancedSearchParams
): Promise<PaginatedResult<Komik>> {
  // Map to Komikcast list filter parameters
  const sortby = params.sort === "popular" ? "popular" : "update";
  const { items, hasMore } = await getKomikList({
    page: params.page ?? 1,
    sortby,
    type: params.type !== "all" ? params.type : undefined,
    status: params.status !== "all" ? params.status : undefined,
    genre: params.genre !== "all" ? params.genre : undefined,
  });

  // If query provided, filter client-side (Komikcast list doesn't support keyword+filter together)
  const filtered = params.q
    ? items.filter((k) => k.title.toLowerCase().includes(params.q!.toLowerCase()))
    : items;

  return {
    items: filtered,
    hasNextPage: hasMore,
    totalPages: hasMore ? (params.page ?? 1) + 1 : (params.page ?? 1),
  };
}

// ==================== GENRE ====================

export async function getKomikByGenre(genre: string, page = 1): Promise<PaginatedResult<Komik>> {
  return scrapeByGenre(genre, page);
}

// ==================== CHAPTER & IMAGES ====================

export async function getKomikImages(chapterId: string): Promise<KomikImage[]> {
  return scrapeImages(chapterId);
}

export async function getKomikChapterData(chapterId: string): Promise<KomikChapterData | null> {
  return scrapeChapterData(chapterId);
}

// ==================== CATALOG / SEEDING ====================

export async function getKomikUnlimited(params?: {
  type?: string;
  max_pages?: number;
}): Promise<Komik[]> {
  const maxPages = params?.max_pages ?? 3;
  const results: Komik[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const { items, hasMore } = await getKomikList({
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
  return getLatestKomik();
}

export async function getKomikScroll(params?: {
  offset?: number;
  batch_size?: number;
  seed?: string;
  type?: string;
}): Promise<{ items: Komik[]; nextOffset: number | null }> {
  const batchSize = params?.batch_size ?? 20;
  const offset = params?.offset ?? 0;
  // Convert offset to page number (Komikcast uses page-based pagination)
  const page = Math.floor(offset / batchSize) + 1;

  const { items, hasMore } = await getKomikList({ page, sortby: "update" });
  const nextOffset = hasMore ? offset + items.length : null;

  return { items, nextOffset };
}

// ==================== GENRES ====================

import type { KomikGenre } from "@/types";

export async function getKomikGenres(): Promise<KomikGenre[]> {
  return scrapeGenres();
}
