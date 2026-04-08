/**
 * Anime API — Otakudesu Source
 *
 * All anime data is scraped directly from otakudesu.cloud.
 * Replaces the previous sankavollerei.com JSON API.
 */

import type {
  Anime,
  AnimeGenre,
  AnimeScheduleDay,
  AnimeBatchDownload,
  PaginatedResult,
} from "@/types";
import type { RawEpisodeData } from "./types";
import {
  getOngoingAnime,
  getCompleteAnime,
  getHomeAnime,
  getAnimeDetail as scrapeAnimeDetail,
  getAnimeEpisode as scrapeAnimeEpisode,
  getAnimeServerUrl as resolveServerUrl,
  searchAnime as scrapeSearchAnime,
  getAnimeSchedule as scrapeAnimeSchedule,
  getAnimeGenres as scrapeAnimeGenres,
  getAnimeByGenre as scrapeAnimeByGenre,
  getAnimeBatch as scrapeAnimeBatch,
} from "./scrapers/otakudesu";

// Re-export for consumers that import extractEpisodeNumber from this module
export function extractEpisodeNumber(text: string): number {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

// ==================== ANIME LIST ENDPOINTS ====================

export async function getAnimeLatest(): Promise<Anime[]> {
  return getOngoingAnime();
}

export async function getAnimeRecommended(page = 1): Promise<Anime[]> {
  const { ongoing, complete } = await getHomeAnime();
  const all = [...ongoing, ...complete];
  const perPage = 20;
  const start = (page - 1) * perPage;
  return all.slice(start, start + perPage);
}

export async function getAnimeMovie(): Promise<Anime[]> {
  return getCompleteAnime();
}

export async function getAnimeUnlimited(): Promise<Anime[]> {
  return getCompleteAnime();
}

// ==================== ANIME DETAIL ====================

export async function getAnimeDetail(urlId: string): Promise<Anime | null> {
  return scrapeAnimeDetail(urlId);
}

// ==================== ANIME SEARCH ====================

export async function searchAnime(query: string): Promise<Anime[]> {
  return scrapeSearchAnime(query);
}

// ==================== ANIME VIDEO ====================

export interface AnimeVideoResult {
  url: string | null;
  type: "direct" | "embed";
  availableResolutions: string[];
}

export async function getAnimeVideo(
  episodeId: string,
  quality = "480p"
): Promise<AnimeVideoResult> {
  try {
    const res = await fetch(
      `/api/anime/video?episodeId=${encodeURIComponent(episodeId)}&quality=${encodeURIComponent(quality)}`
    );
    if (!res.ok) return { url: null, type: "embed", availableResolutions: [] };
    const data = await res.json();
    return {
      url: data.url || null,
      type: data.type || "embed",
      availableResolutions: data.availableResolutions || [],
    };
  } catch {
    return { url: null, type: "embed", availableResolutions: [] };
  }
}

export async function getAnimeEpisode(episodeId: string): Promise<RawEpisodeData | null> {
  return scrapeAnimeEpisode(episodeId);
}

export async function getAnimeServerUrl(serverId: string): Promise<string | null> {
  return resolveServerUrl(serverId);
}

// ==================== ANIME SCHEDULE ====================

export async function getAnimeSchedule(): Promise<AnimeScheduleDay[]> {
  return scrapeAnimeSchedule();
}

// ==================== ANIME GENRES ====================

export async function getAnimeGenres(): Promise<AnimeGenre[]> {
  return scrapeAnimeGenres();
}

export async function getAnimeByGenre(slug: string, page = 1): Promise<PaginatedResult<Anime>> {
  return scrapeAnimeByGenre(slug, page);
}

// ==================== ANIME BATCH ====================

export async function getAnimeBatch(slug: string): Promise<AnimeBatchDownload | null> {
  return scrapeAnimeBatch(slug);
}
