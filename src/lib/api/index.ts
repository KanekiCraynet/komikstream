/**
 * Public API exports
 *
 * This barrel file exposes all public API functions and types.
 * Import from '@/lib/api' instead of individual files.
 */

// ==================== TYPES ====================
export type { RawServerItem, RawQualityItem, RawEpisodeData } from "./types";

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
  extractEpisodeNumber,
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
  getKomikGenres,
  type KomikAdvancedSearchParams,
} from "./komik";

// ==================== HOMEPAGE ====================
export { getHomepageData } from "./homepage";
