// ==================== KOMIK TYPES ====================

export interface Komik {
  manga_id: string;
  title: string;
  thumbnail?: string;
  cover?: string;
  type?: string; // manhwa, manhua, manga
  status?: string;
  rating?: string | number;
  description?: string;
  author?: string;
  artist?: string;
  genres?: string[];
  chapters?: KomikChapter[];
  latestChapter?: string;
  updatedAt?: string;
}

export interface KomikChapter {
  chapter_id: string;
  title: string;
  chapter?: string | number;
  url?: string;
  date?: string;
}

export interface KomikImage {
  url: string;
  page?: number;
}

// ==================== ANIME TYPES ====================

export interface Anime {
  urlId: string;
  title: string;
  thumbnail?: string;
  cover?: string;
  poster?: string;
  type?: string;
  status?: string;
  rating?: string | number;
  score?: string | number;
  description?: string;
  synopsis?: string;
  genres?: string[];
  episodes?: AnimeEpisode[];
  chapter?: AnimeEpisode[]; // API sometimes uses 'chapter' for episodes
  totalEpisodes?: number;
  duration?: string;
  studio?: string;
  season?: string;
  year?: number;
  updatedAt?: string;
}

export interface AnimeEpisode {
  episodeId?: string;
  url?: string;
  title: string;
  episode?: string | number;
  date?: string;
}

export interface AnimeVideo {
  url: string;
  quality?: string;
  resolution?: string;
}

// ==================== GENRE & SCHEDULE TYPES ====================

export interface AnimeGenre {
  title: string;
  genreId: string;
  href?: string;
  otakudesuUrl?: string;
}

export interface AnimeScheduleDay {
  day: string;
  animeList: Array<{
    title: string;
    slug: string;
    url: string;
    poster: string;
  }>;
}

export interface AnimeBatchDownload {
  title?: string;
  batchList: Array<{
    title: string;
    qualities: Array<{
      resolution: string;
      urls: Array<{ host: string; url: string }>;
    }>;
  }>;
}

export interface KomikGenre {
  name: string;
  slug: string;
  link?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  hasNextPage: boolean;
  totalPages: number;
}

// ==================== USER & BOOKMARK TYPES ====================

export interface User {
  id: string;
  clerkId: string;
  email: string;
  createdAt: Date;
}

export interface Bookmark {
  id: string;
  userId: string;
  type: "komik" | "anime";
  itemId: string;
  title: string;
  thumbnail?: string;
  createdAt: Date;
}

export interface History {
  id: string;
  userId: string;
  type: "komik" | "anime";
  itemId: string;
  title: string;
  thumbnail?: string;
  progress: string; // chapter_id or episode_id
  progressTitle?: string;
  updatedAt: Date;
}
