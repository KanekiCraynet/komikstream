/**
 * Public API exports
 *
 * This barrel file exposes all public API functions and types.
 * Import from '@/lib/api' instead of individual files.
 */

// ==================== TYPES ====================
export type {
  // Raw API response types (for advanced use cases)
  RawAnimeListItem,
  RawAnimeDetailData,
  RawGenreItem,
  RawEpisodeListItem,
  RawAnimeResponse,
  RawServerItem,
  RawQualityItem,
  RawEpisodeData,
  RawScheduleDay,
  RawScheduleResponse,
  RawBatchQuality,
  RawBatchData,
  RawComicListItem,
  RawComicCatalogItem,
  RawComicSearchItem,
  RawComicDetailData,
  RawComicChapterItem,
  RawComicGenreItem,
  RawComicChapterData,
  RawComicPaginatedResponse,
  RawComicScrollResponse,
} from "./types";

// ==================== CONSTANTS ====================
export { BASE_URL, ANIME_HEADERS, COMIC_HEADERS } from "./constants";

// ==================== CORE UTILITIES ====================
export { fetchWithCache, ensureArray } from "./fetch";

// ==================== TRANSFORMERS ====================
export {
  // Anime transformers
  transformAnimeListItem,
  transformAnimeDetail,
  extractEpisodeNumber,
  // Komik transformers
  extractChapterNumber,
  extractMangaSlug,
  extractMangaSlugFromChapter,
  transformComicListItem,
  transformComicCatalogItem,
  transformComicSearchItem,
  transformComicChapter,
  transformComicDetail,
} from "./transformers";

// ==================== ANIME API ====================
export {
  getAnimeLatest,
  getAnimeRecommended,
  getAnimeMovie,
  getAnimeUnlimited,
  getAnimeDetail,
  searchAnime,
  getAnimeVideo,
  getAnimeEpisode,
  getAnimeServerUrl,
  getAnimeSchedule,
  getAnimeGenres,
  getAnimeByGenre,
  getAnimeBatch,
  // Types
  type AnimeVideoResult,
} from "./anime";

// ==================== KOMIK API ====================
export {
  getKomikLatest,
  getKomikPopular,
  getKomikRecommended,
  getKomikBerwarna,
  getKomikPustaka,
  getKomikDetail,
  getKomikChapterList,
  searchKomik,
  advancedSearchKomik,
  getKomikByGenre,
  getKomikImages,
  getKomikChapterData,
  getKomikUnlimited,
  getKomikRealtime,
  getKomikScroll,
  // Types
  type KomikAdvancedSearchParams,
} from "./komik";

// ==================== HOMEPAGE ====================
export { getHomepageData } from "./homepage";
