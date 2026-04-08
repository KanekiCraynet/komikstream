/**
 * Sansekai Komik API
 *
 * Fetches manga/comic data from api.sansekai.my.id and maps to internal types.
 * Replaces the Komikcast HTML scraper.
 */

import type {
  Komik,
  KomikChapter,
  KomikChapterData,
  KomikImage,
  KomikGenre,
  PaginatedResult,
} from "@/types";
import { CACHE_TIMES } from "@/lib/cache-config";
import { fetchSansekai } from "./client";

// ─── Sansekai Response Shapes ────────────────────────────────────────────────

interface SansekaiTaxonomy {
  Genre?: Array<{ name: string; slug: string }>;
  Author?: Array<{ name: string; slug: string }>;
  Artist?: Array<{ name: string; slug: string }>;
  Format?: Array<{ name: string; slug: string }>;
  Type?: Array<{ name: string; slug: string }>;
}

interface SansekaiKomikItem {
  manga_id: string;
  title: string;
  alternative_title: string;
  cover_image_url: string;
  cover_portrait_url: string;
  status: number; // 1=ongoing, 2=hiatus, 3=completed
  user_rate: number | null;
  view_count: number;
  bookmark_count: number;
  release_year: string;
  country_id: string;
  taxonomy: SansekaiTaxonomy;
  chapters: Array<{ chapter_id: string; chapter_number: number; created_at?: string }>;
  description?: string;
  latest_chapter_id?: string;
  latest_chapter_number?: number;
  latest_chapter_time?: string;
}

interface SansekaiPaginatedResponse {
  retcode: number;
  message: string;
  meta: { page: number; page_size: number; total_page: number; total_record: number };
  data: SansekaiKomikItem[];
}

interface SansekaiKomikDetailResponse {
  retcode: number;
  data: SansekaiKomikItem & { description: string };
}

interface SansekaiChapterListItem {
  chapter_id: string;
  manga_id: string;
  chapter_title: string;
  chapter_number: number;
  view_count: number;
  release_date: string;
  thumbnail_image_url?: string;
}

interface SansekaiChapterImageData {
  chapter_id: string;
  manga_id: string;
  chapter_number: number;
  chapter_title: string;
  chapter: { data: string[] };
  prev_chapter_id: string | null;
  prev_chapter_number: number | null;
  next_chapter_id: string | null;
  next_chapter_number: number | null;
}

// ─── Mapping Helpers ─────────────────────────────────────────────────────────

const STATUS_MAP: Record<number, string> = { 1: "Ongoing", 2: "Hiatus", 3: "Completed" };

function mapKomikItem(item: SansekaiKomikItem): Komik {
  const genres = item.taxonomy?.Genre?.map((g) => g.name) ?? [];
  const author = item.taxonomy?.Author?.map((a) => a.name).join(", ") || undefined;
  const artist = item.taxonomy?.Artist?.map((a) => a.name).join(", ") || undefined;
  const type = item.taxonomy?.Format?.[0]?.name ?? item.taxonomy?.Type?.[0]?.name ?? undefined;

  return {
    manga_id: item.manga_id,
    title: item.title || item.alternative_title,
    thumbnail: item.cover_image_url,
    cover: item.cover_portrait_url || undefined,
    type,
    status: STATUS_MAP[item.status] ?? undefined,
    rating: item.user_rate ?? undefined,
    description: item.description ?? undefined,
    author,
    artist,
    genres,
    latestChapter: item.latest_chapter_number
      ? `Chapter ${item.latest_chapter_number}`
      : item.chapters?.[0]?.chapter_number
        ? `Chapter ${item.chapters[0].chapter_number}`
        : undefined,
  };
}

function mapChapterListItem(item: SansekaiChapterListItem): KomikChapter {
  return {
    chapter_id: item.chapter_id,
    title: item.chapter_title || `Chapter ${item.chapter_number}`,
    chapter: item.chapter_number,
    date: item.release_date,
  };
}

function mapChapterData(data: SansekaiChapterImageData, mangaTitle?: string): KomikChapterData {
  return {
    mangaTitle: mangaTitle ?? "",
    mangaSlug: data.manga_id,
    chapterTitle: data.chapter_title || `Chapter ${data.chapter_number}`,
    navigation: {
      previousChapter: data.prev_chapter_id,
      nextChapter: data.next_chapter_id,
    },
    images: data.chapter.data.map((url, i) => ({ url, page: i + 1 })),
  };
}

// ─── Exported Fetch Functions ────────────────────────────────────────────────

export async function fetchKomikLatest(type?: string): Promise<Komik[]> {
  const t = type ?? "mirror";
  const res = await fetchSansekai<SansekaiPaginatedResponse>(
    `/komik/latest?type=${encodeURIComponent(t)}`,
    CACHE_TIMES.LATEST
  );
  return (res?.data ?? []).map(mapKomikItem);
}

export async function fetchKomikPopular(page = 1): Promise<Komik[]> {
  const res = await fetchSansekai<SansekaiPaginatedResponse>(
    `/komik/popular?page=${page}`,
    CACHE_TIMES.POPULAR
  );
  return (res?.data ?? []).map(mapKomikItem);
}

export async function fetchKomikRecommended(type?: string): Promise<Komik[]> {
  const t = type ?? "manhwa";
  const res = await fetchSansekai<SansekaiPaginatedResponse>(
    `/komik/recommended?type=${encodeURIComponent(t)}`,
    CACHE_TIMES.POPULAR
  );
  return (res?.data ?? []).map(mapKomikItem);
}

export async function fetchKomikSearch(query: string): Promise<Komik[]> {
  const res = await fetchSansekai<SansekaiPaginatedResponse>(
    `/komik/search?query=${encodeURIComponent(query)}`,
    CACHE_TIMES.SEARCH
  );
  return (res?.data ?? []).map(mapKomikItem);
}

export async function fetchKomikDetail(mangaId: string): Promise<Komik | null> {
  const [detailRes, chapters] = await Promise.all([
    fetchSansekai<SansekaiKomikDetailResponse>(
      `/komik/detail?manga_id=${encodeURIComponent(mangaId)}`,
      CACHE_TIMES.DETAIL
    ),
    fetchKomikChapterList(mangaId),
  ]);

  if (!detailRes?.data?.manga_id) return null;

  const komik = mapKomikItem(detailRes.data);
  komik.description = detailRes.data.description || komik.description;
  komik.chapters = chapters;
  return komik;
}

export async function fetchKomikChapterList(mangaId: string): Promise<KomikChapter[]> {
  const res = await fetchSansekai<{ data: SansekaiChapterListItem[] }>(
    `/komik/chapterlist?manga_id=${encodeURIComponent(mangaId)}`,
    CACHE_TIMES.DETAIL
  );
  return (res?.data ?? []).map(mapChapterListItem);
}

export async function fetchKomikChapterData(chapterId: string): Promise<KomikChapterData | null> {
  const res = await fetchSansekai<{ data: SansekaiChapterImageData }>(
    `/komik/getimage?chapter_id=${encodeURIComponent(chapterId)}`,
    CACHE_TIMES.IMAGES
  );
  if (!res?.data?.chapter?.data?.length) return null;
  return mapChapterData(res.data);
}

export async function fetchKomikImages(chapterId: string): Promise<KomikImage[]> {
  const data = await fetchKomikChapterData(chapterId);
  return data?.images ?? [];
}

export async function fetchKomikGenres(): Promise<KomikGenre[]> {
  // Extract unique genres from the popular list
  const res = await fetchSansekai<SansekaiPaginatedResponse>(
    "/komik/popular?page=1",
    CACHE_TIMES.STATIC
  );
  const seen = new Map<string, KomikGenre>();
  for (const item of res?.data ?? []) {
    for (const g of item.taxonomy?.Genre ?? []) {
      if (g.slug && !seen.has(g.slug)) {
        seen.set(g.slug, { name: g.name, slug: g.slug });
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchKomikByGenre(genre: string, page = 1): Promise<PaginatedResult<Komik>> {
  // Sansekai has no genre filter — fetch popular and filter client-side
  const res = await fetchSansekai<SansekaiPaginatedResponse>(
    `/komik/popular?page=${page}`,
    CACHE_TIMES.POPULAR
  );
  const all = (res?.data ?? []).map(mapKomikItem);
  const filtered = all.filter((k) =>
    k.genres?.some((g) => g.toLowerCase() === genre.toLowerCase())
  );
  const hasNextPage = (res?.meta?.total_page ?? 0) > page;
  return { items: filtered, hasNextPage, totalPages: res?.meta?.total_page ?? page };
}

export async function fetchKomikList(params: {
  page?: number;
  sortby?: string;
  type?: string;
}): Promise<{ items: Komik[]; hasMore: boolean; totalPages: number }> {
  const page = params.page ?? 1;
  const endpoint =
    params.sortby === "popular"
      ? `/komik/popular?page=${page}`
      : `/komik/latest?type=${encodeURIComponent(params.type ?? "mirror")}`;

  const res = await fetchSansekai<SansekaiPaginatedResponse>(endpoint, CACHE_TIMES.POPULAR);
  const items = (res?.data ?? []).map(mapKomikItem);
  const totalPages = res?.meta?.total_page ?? page;
  const hasMore = totalPages > page;

  return { items, hasMore, totalPages };
}
