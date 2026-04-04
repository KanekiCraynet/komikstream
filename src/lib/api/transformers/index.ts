/**
 * Transformers — Barrel Export
 *
 * Re-exports all transformer functions for convenient imports.
 */

// Anime transformers
export { extractEpisodeNumber, transformAnimeListItem, transformAnimeDetail } from "./anime";

// Komik transformers
export {
  extractChapterNumber,
  extractMangaSlug,
  extractMangaSlugFromChapter,
  transformComicListItem,
  transformComicCatalogItem,
  transformComicSearchItem,
  transformComicChapter,
  transformComicDetail,
} from "./komik";
