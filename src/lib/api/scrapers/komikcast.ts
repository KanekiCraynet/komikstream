/**
 * Komikcast HTML Scraper
 *
 * Scrapes manga/comic data directly from komikcast03.com using cheerio.
 * Replaces the sankavollerei.com API for all comic endpoints.
 *
 * Base URL is configurable via KOMIKCAST_URL env var.
 */

import type { Element } from "domhandler";
import type {
  Komik,
  KomikChapter,
  KomikChapterData,
  KomikImage,
  KomikGenre,
  PaginatedResult,
} from "@/types";
import { CACHE_TIMES } from "@/lib/cache-config";
import { fetchHtml } from "./fetch";

const BASE = (process.env.KOMIKCAST_URL ?? "https://komikcast03.com").replace(/\/$/, "");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract manga slug from a komikcast URL. e.g. .../komik/naruto/ → "naruto" */
function mangaSlugFromUrl(url: string | undefined): string {
  if (!url) return "";
  const m = url.match(/\/komik\/([^/?#]+)/);
  return m ? m[1] : "";
}

/** Extract chapter slug from a komikcast chapter URL. e.g. .../chapter/naruto-chapter-1/ → "naruto-chapter-1" */
function chapterSlugFromUrl(url: string | undefined): string {
  if (!url) return "";
  const m = url.match(/\/chapter\/([^/?#]+)/);
  if (m) return m[1];
  // Fallback: last path segment
  return url.replace(/\/$/, "").split("/").filter(Boolean).pop() ?? "";
}

/** Extract manga slug from a chapter slug. e.g. "naruto-chapter-1" → "naruto" */
function mangaSlugFromChapter(chapterSlug: string): string {
  const m = chapterSlug.match(/^(.+)-chapter-[\d.]+$/i);
  return m ? m[1] : chapterSlug;
}

function parseChapterNumber(text: string): number {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

/** Parse a .list-update_item element into a Komik object. */
function parseListItem($: ReturnType<typeof import("cheerio").load>, el: Element): Komik | null {
  const $el = $(el);
  const a = $el.find("a").first();
  const href = a.attr("href") ?? "";
  const slug = mangaSlugFromUrl(href);
  if (!slug) return null;

  const title = $el.find(".list-update_item-info .title, .title").text().trim();
  const thumbnail =
    $el.find(".list-update_item-image img, img").first().attr("src") ??
    $el.find(".list-update_item-image img, img").first().attr("data-src") ??
    "";
  const rating = $el.find(".numscore, .rating .numscore").text().trim();
  const latestChapter =
    $el.find(".chapter a, .list-update_item-info .chapter").first().text().trim() || undefined;
  const type = $el.find(".type, .list-update_item-info .type").text().trim() || undefined;

  return {
    manga_id: slug,
    title: title || a.attr("title") || "",
    thumbnail,
    rating: rating || undefined,
    latestChapter,
    type,
  };
}

// ─── Comic Lists ──────────────────────────────────────────────────────────────

export async function getLatestKomik(): Promise<Komik[]> {
  const $ = await fetchHtml(`${BASE}/daftar-komik/?sortby=update`, CACHE_TIMES.LATEST);
  const items: Komik[] = [];
  $(".list-update_items-wrapper .list-update_item").each((_, el) => {
    const item = parseListItem($, el);
    if (item) items.push(item);
  });
  return items;
}

export async function getPopularKomik(page = 1): Promise<Komik[]> {
  const url =
    page > 1
      ? `${BASE}/daftar-komik/page/${page}/?sortby=popular`
      : `${BASE}/daftar-komik/?sortby=popular`;
  const $ = await fetchHtml(url, CACHE_TIMES.POPULAR);
  const items: Komik[] = [];
  $(".list-update_items-wrapper .list-update_item").each((_, el) => {
    const item = parseListItem($, el);
    if (item) items.push(item);
  });
  return items;
}

export async function getKomikList(params?: {
  page?: number;
  sortby?: string;
  type?: string;
  status?: string;
  genre?: string;
}): Promise<{ items: Komik[]; hasMore: boolean }> {
  const sp = new URLSearchParams();
  if (params?.sortby) sp.set("sortby", params.sortby);
  if (params?.type) sp.set("type", params.type);
  if (params?.status) sp.set("status", params.status);
  if (params?.genre) sp.set("genre", params.genre);

  const page = params?.page ?? 1;
  const pagePath = page > 1 ? `/page/${page}` : "";
  const qs = sp.toString();
  const url = `${BASE}/daftar-komik${pagePath}/${qs ? `?${qs}` : ""}`;

  const $ = await fetchHtml(url, CACHE_TIMES.POPULAR);
  const items: Komik[] = [];
  $(".list-update_items-wrapper .list-update_item").each((_, el) => {
    const item = parseListItem($, el);
    if (item) items.push(item);
  });

  const hasMore = !!$("a.next, .pagination a.next, .nav-links a.next").length;
  return { items, hasMore };
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchKomik(query: string): Promise<Komik[]> {
  const $ = await fetchHtml(
    `${BASE}/?s=${encodeURIComponent(query)}&post_type=manga`,
    CACHE_TIMES.SEARCH
  );
  const items: Komik[] = [];

  $(".list-update_items-wrapper .list-update_item").each((_, el) => {
    const item = parseListItem($, el);
    if (item) items.push(item);
  });

  // Fallback: some search results use a different layout
  if (!items.length) {
    $(".bsx, .utao, .bs").each((_, el) => {
      const a = $(el).find("a").first();
      const href = a.attr("href") ?? "";
      const slug = mangaSlugFromUrl(href);
      if (!slug) return;
      const title = $(el).find("h2, .tt").first().text().trim();
      const thumbnail = $(el).find("img").first().attr("src") ?? "";
      items.push({ manga_id: slug, title, thumbnail });
    });
  }

  return items;
}

// ─── Comic Detail ─────────────────────────────────────────────────────────────

export async function getKomikDetail(slug: string): Promise<Komik | null> {
  const $ = await fetchHtml(`${BASE}/komik/${slug}/`, CACHE_TIMES.DETAIL);

  const title = $(".komik_info-content-body-title, .entry-title h1").first().text().trim();
  if (!title) return null;

  const thumbnail =
    $(".komik_info-content-thumbnail img").first().attr("src") ??
    $(".komik_info-content-thumbnail img").first().attr("data-src") ??
    "";

  // Meta info from spans
  const meta: Record<string, string> = {};
  $(".komik_info-content-meta span").each((_, el) => {
    const text = $(el).text();
    const colonIdx = text.indexOf(":");
    if (colonIdx === -1) return;
    const key = text.slice(0, colonIdx).trim().toLowerCase();
    const val = text.slice(colonIdx + 1).trim();
    meta[key] = val;
  });

  // Genres
  const genres: string[] = [];
  $(".komik_info-content-genre .genre-item").each((_, el) => {
    const g = $(el).text().trim();
    if (g) genres.push(g);
  });

  const synopsis =
    $(".komik_info-description-sinopsis p")
      .map((_, el) => $(el).text().trim())
      .get()
      .join("\n\n") ||
    $(".komik_info-description-sinopsis").text().trim() ||
    $(".entry-content p").first().text().trim();

  // Chapter list
  const chapters: KomikChapter[] = [];
  $(".komik_info-chapters-wrapper li").each((_, el) => {
    const a = $(el).find("a").first();
    const href = a.attr("href") ?? "";
    const chapterSlug = chapterSlugFromUrl(href);
    const chapterTitle = a.text().trim();
    const date = $(el).find(".chapter-link-time").text().trim() || undefined;

    if (chapterSlug) {
      chapters.push({
        chapter_id: chapterSlug,
        title: chapterTitle,
        chapter: parseChapterNumber(chapterTitle),
        date,
      });
    }
  });

  chapters.sort((a, b) => {
    const na = typeof a.chapter === "number" ? a.chapter : parseFloat(String(a.chapter)) || 0;
    const nb = typeof b.chapter === "number" ? b.chapter : parseFloat(String(b.chapter)) || 0;
    return na - nb;
  });

  return {
    manga_id: slug,
    title,
    thumbnail,
    cover: thumbnail,
    type: meta["type"] || meta["tipe"] || undefined,
    status: meta["status"] || undefined,
    author: meta["author"] || meta["author(s)"] || meta["pengarang"] || undefined,
    description: synopsis || undefined,
    genres,
    chapters,
    latestChapter: chapters.length ? chapters[chapters.length - 1]?.title : undefined,
  };
}

// ─── Chapter List ─────────────────────────────────────────────────────────────

export async function getKomikChapterList(slug: string): Promise<KomikChapter[]> {
  const detail = await getKomikDetail(slug);
  return detail?.chapters ?? [];
}

// ─── Chapter Data (Images + Navigation) ──────────────────────────────────────

export async function getKomikChapterData(chapterSlug: string): Promise<KomikChapterData | null> {
  const $ = await fetchHtml(`${BASE}/chapter/${chapterSlug}/`, CACHE_TIMES.IMAGES);

  // Chapter images
  const images: KomikImage[] = [];
  $(".main-reading-area img").each((i, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src") ?? "";
    if (src && !src.includes("data:image")) {
      images.push({ url: src, page: i + 1 });
    }
  });

  if (!images.length) return null;

  // Navigation — Komikcast uses .nextprev or similar
  const prevHref =
    $(".nextprev a.prev, .chapter_navigation .prev, .manga-reading-nav-head a:first-child").attr(
      "href"
    ) ||
    $(".prevnext a:first-child").attr("href") ||
    null;
  const nextHref =
    $(".nextprev a.next, .chapter_navigation .next, .manga-reading-nav-head a:last-child").attr(
      "href"
    ) ||
    $(".prevnext a:last-child").attr("href") ||
    null;

  const prevChapterSlug = prevHref ? chapterSlugFromUrl(prevHref) : null;
  const nextChapterSlug = nextHref ? chapterSlugFromUrl(nextHref) : null;

  // Manga title — from breadcrumb or heading
  const mangaTitle =
    $(".breadcrumb a, .allc a, .breacrumb li a").eq(-2).text().trim() ||
    $(".entry-title, .cha-tit h1, h1")
      .first()
      .text()
      .replace(/chapter.*/i, "")
      .trim() ||
    "";

  const mangaSlug = mangaSlugFromChapter(chapterSlug);

  // Chapter title
  const chapterTitle =
    $(".cha-tit h1, .entry-title, .reading-title").first().text().trim() ||
    `Chapter ${parseChapterNumber(chapterSlug)}`;

  return {
    mangaTitle,
    mangaSlug,
    chapterTitle,
    navigation: {
      previousChapter: prevChapterSlug,
      nextChapter: nextChapterSlug,
    },
    images,
  };
}

// ─── Chapter Images (legacy) ──────────────────────────────────────────────────

export async function getKomikImages(chapterSlug: string): Promise<KomikImage[]> {
  const data = await getKomikChapterData(chapterSlug);
  return data?.images ?? [];
}

// ─── Genres ───────────────────────────────────────────────────────────────────

export async function getKomikGenres(): Promise<KomikGenre[]> {
  const $ = await fetchHtml(`${BASE}/genre/`, CACHE_TIMES.STATIC);
  const genres: KomikGenre[] = [];

  $(".genre_item a, .genres li a, .list-genre a").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const name = $(el).text().trim();
    const m = href.match(/\/genre\/([^/?#]+)/);
    const slug = m ? m[1] : name.toLowerCase().replace(/\s+/g, "-");
    if (name && slug) genres.push({ name, slug, link: href });
  });

  return genres;
}

// ─── By Genre ─────────────────────────────────────────────────────────────────

export async function getKomikByGenre(genre: string, page = 1): Promise<PaginatedResult<Komik>> {
  const pagePath = page > 1 ? `/page/${page}` : "";
  const $ = await fetchHtml(`${BASE}/genre/${genre}${pagePath}/`, CACHE_TIMES.POPULAR);

  const items: Komik[] = [];
  $(".list-update_items-wrapper .list-update_item").each((_, el) => {
    const item = parseListItem($, el);
    if (item) items.push(item);
  });

  const hasNextPage = !!$("a.next, .pagination a.next, .nav-links a.next").length;

  return { items, hasNextPage, totalPages: hasNextPage ? page + 1 : page };
}
