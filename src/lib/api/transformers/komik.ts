/**
 * Komik Transformers — Convert raw API responses to internal types
 *
 * Transforms data from the sankavollerei.com Komiku source
 * into the Komik/KomikChapter types used throughout the application.
 */

import type { Komik, KomikChapter } from "@/types";
import type {
  RawComicListItem,
  RawComicSearchItem,
  RawComicDetailData,
  RawComicChapterItem,
  RawComicCatalogItem,
} from "../types";
import { ensureArray } from "../fetch";

/**
 * Extract chapter number from a title like "Chapter 18" or "Ch. 10.5".
 *
 * @param title - Chapter title string
 * @returns Extracted chapter number (0 if not found)
 */
export function extractChapterNumber(title: string): number {
  const match = title.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Extract manga slug from a full link URL.
 *
 * Handles both relative and absolute URLs:
 * - "/manga/some-slug/"
 * - "https://komiku.org/manga/some-slug/"
 *
 * @param link - Full or relative link to manga
 * @returns Extracted slug or empty string
 */
export function extractMangaSlug(link: string | undefined): string {
  if (!link) return "";
  const match = link.match(/\/manga\/([^/?#]+)/);
  return match ? match[1] : "";
}

/**
 * Extract manga slug from chapter ID.
 *
 * Chapter IDs follow format: {manga-slug}-chapter-{number}
 * Falls back to slugifying the manga title if pattern doesn't match.
 *
 * @param chapterId - Chapter identifier
 * @param mangaTitle - Fallback manga title for slugification
 * @returns Extracted or generated manga slug
 */
export function extractMangaSlugFromChapter(chapterId: string, mangaTitle: string): string {
  // Try to extract from chapter ID by removing "-chapter-{number}" suffix
  const chapterMatch = chapterId.match(/^(.+)-chapter-\d+$/i);
  if (chapterMatch) {
    return chapterMatch[1];
  }

  // Fallback: slugify the manga title
  return mangaTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Transform a comic list item (from /comic/terbaru, /comic/populer).
 *
 * These items have minimal data — only title, image, link, chapter, time_ago.
 * We extract the slug from the link to use as manga_id.
 *
 * @param raw - Raw API response item
 * @returns Transformed Komik object
 */
export function transformComicListItem(raw: RawComicListItem): Komik {
  return {
    manga_id: extractMangaSlug(raw.link),
    title: raw.title || "",
    thumbnail: raw.image || "",
    latestChapter: raw.chapter || undefined,
    updatedAt: raw.time_ago || undefined,
  };
}

/**
 * Transform a catalog item (from /comic/berwarna, /comic/pustaka).
 *
 * These use `url` (full komiku.org URL) instead of `link`, and include
 * type/genre/description metadata.
 *
 * @param raw - Raw API catalog item
 * @returns Transformed Komik object
 */
export function transformComicCatalogItem(raw: RawComicCatalogItem): Komik {
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

/**
 * Transform a search result item.
 *
 * Search results include slug directly and have more metadata
 * than list items.
 *
 * @param raw - Raw API search result
 * @returns Transformed Komik object
 */
export function transformComicSearchItem(raw: RawComicSearchItem): Komik {
  return {
    manga_id: raw.slug || "",
    title: raw.title || "",
    thumbnail: raw.thumbnail || "",
    type: raw.type || undefined,
    genres: raw.genre ? [raw.genre] : [],
    description: raw.description || undefined,
  };
}

/**
 * Transform a comic chapter item.
 *
 * @param raw - Raw API chapter item
 * @returns Transformed KomikChapter object
 */
export function transformComicChapter(raw: RawComicChapterItem): KomikChapter {
  return {
    chapter_id: raw.slug || "",
    title: raw.chapter || "",
    chapter: extractChapterNumber(raw.chapter || ""),
    date: raw.date || undefined,
  };
}

/**
 * Transform full comic detail response.
 *
 * Includes chapters sorted by number ascending.
 *
 * @param raw - Raw API detail response
 * @returns Transformed Komik object with chapters
 */
export function transformComicDetail(raw: RawComicDetailData): Komik {
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
