/**
 * Anime Transformers — Convert raw API responses to internal types
 *
 * Transforms data from the sankavollerei.com Otakudesu source
 * into the Anime type used throughout the application.
 */

import type { Anime } from "@/types";
import type { RawAnimeListItem, RawAnimeDetailData } from "../types";
import { ensureArray } from "../fetch";

/**
 * Extract episode number from a title string.
 * Handles various formats: "Episode 10", "Ep. 10.5", "10", etc.
 *
 * @param text - Episode title or identifier
 * @returns Extracted episode number (0 if not found)
 */
export function extractEpisodeNumber(text: string): number {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Transform a raw anime list item to internal Anime type.
 *
 * Used for list endpoints: /anime/ongoing-anime, /anime/complete-anime,
 * /anime/search, /anime/genre/{slug}, etc.
 *
 * @param raw - Raw API response item
 * @returns Transformed Anime object
 */
export function transformAnimeListItem(raw: RawAnimeListItem): Anime {
  return {
    urlId: raw.animeId || "",
    title: raw.title || "",
    thumbnail: raw.poster || "",
    rating: raw.score || undefined,
    type: undefined,
    status: raw.status || undefined,
    genres: raw.genreList?.map((g) => g.title) || [],
    episodes: [],
  };
}

/**
 * Transform raw anime detail data to internal Anime type.
 *
 * Used for detail endpoint: /anime/anime/{urlId}
 * Includes full episode list, synopsis, and metadata.
 *
 * @param raw - Raw API detail response
 * @param urlId - The URL identifier for this anime
 * @returns Transformed Anime object with episodes
 */
export function transformAnimeDetail(raw: RawAnimeDetailData, urlId: string): Anime {
  const synopsis = raw.synopsis?.paragraphs?.join("\n\n") || undefined;

  // Sort ascending by episode number
  const episodes = ensureArray(raw.episodeList)
    .map((ep) => {
      // The upstream API may return episodeId as a full path like
      // "/anime/episode/sdhm-episode-1-sub-indo" — extract only the bare slug
      // to avoid broken URLs when interpolated into /anime/watch/{animeUrlId}/{slug}
      const epSlug = (ep.episodeId || "").split("/").filter(Boolean).pop() || "";
      return {
        episodeId: epSlug,
        title: ep.title || `Episode ${ep.eps}`,
        episode: ep.eps,
        url: epSlug,
        date: ep.date || undefined,
      };
    })
    .sort((a, b) => extractEpisodeNumber(a.title) - extractEpisodeNumber(b.title));

  return {
    urlId,
    title: raw.title || "",
    thumbnail: raw.poster || "",
    cover: raw.poster || "",
    synopsis,
    rating: raw.score || undefined,
    type: raw.type || undefined,
    status: raw.status || undefined,
    genres: raw.genreList?.map((g) => g.title) || [],
    episodes,
    totalEpisodes: raw.episodes ?? undefined,
    duration: raw.duration || undefined,
    studio: raw.studios || undefined,
  };
}
