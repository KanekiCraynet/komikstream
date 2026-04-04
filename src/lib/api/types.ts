/**
 * Raw API Response Types — sankavollerei.com Provider
 *
 * These interfaces map directly to the JSON shapes returned by the external API.
 * Internal code should use transformed types from @/types instead.
 */

// ==================== ANIME (Otakudesu source) ====================

export interface RawAnimeListItem {
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

export interface RawGenreItem {
  title: string;
  genreId: string;
  href?: string;
  otakudesuUrl?: string;
}

export interface RawAnimeDetailData {
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

export interface RawEpisodeListItem {
  title?: string;
  eps?: number;
  date?: string;
  episodeId?: string;
  href?: string;
  otakudesuUrl?: string;
}

export interface RawAnimeResponse<T> {
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

// ==================== ANIME EPISODE & SERVER ====================

export interface RawServerItem {
  title?: string;
  serverId?: string;
  href?: string;
}

export interface RawQualityItem {
  title?: string;
  serverList?: RawServerItem[];
}

export interface RawEpisodeData {
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

// ==================== ANIME SCHEDULE & BATCH ====================

export interface RawScheduleDay {
  day?: string;
  anime_list?: Array<{
    title?: string;
    slug?: string;
    url?: string;
    poster?: string;
  }>;
}

export interface RawScheduleResponse {
  data?: RawScheduleDay[];
}

export interface RawBatchQuality {
  title?: string;
  size?: string;
  urls?: Array<{ title?: string; url?: string }>;
}

export interface RawBatchData {
  title?: string;
  batchList?: Array<{
    title?: string;
    qualities?: RawBatchQuality[];
  }>;
}

// ==================== COMIC (Komiku source) ====================

export interface RawComicListItem {
  title?: string;
  link?: string;
  image?: string;
  chapter?: string;
  time_ago?: string;
}

export interface RawComicSearchItem {
  title?: string;
  altTitle?: string | null;
  slug?: string;
  href?: string;
  thumbnail?: string;
  type?: string;
  genre?: string;
  description?: string;
}

export interface RawComicGenreItem {
  name: string;
  slug: string;
  link?: string;
}

export interface RawComicChapterItem {
  chapter?: string;
  slug?: string;
  link?: string;
  date?: string;
}

export interface RawComicDetailData {
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

export interface RawComicChapterData {
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

// ==================== COMIC CATALOG (berwarna, pustaka) ====================

export interface RawComicCatalogItem {
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

// ==================== COMIC PAGINATION ====================

export interface RawComicPaginatedResponse {
  comics?: RawComicListItem[];
  pagination?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    total_on_page?: number;
    has_more?: boolean;
  };
}

export interface RawComicScrollResponse {
  comics?: RawComicListItem[];
  next_offset?: number | null;
  has_more?: boolean;
}
