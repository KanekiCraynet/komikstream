/**
 * Anime API — Sansekai Source
 *
 * Thin wrapper delegating to the Sansekai JSON API module.
 * Public signatures unchanged so all consumers keep working.
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
  fetchAnimeLatest,
  fetchAnimeRecommended,
  fetchAnimeMovie,
  fetchAnimeSearch,
  fetchAnimeDetail,
  fetchAnimeEpisode,
  fetchAnimeServerUrl,
  fetchAnimeSchedule,
  fetchAnimeGenres,
  fetchAnimeByGenre,
  fetchAnimeBatch,
} from "./sansekai/anime";

export function extractEpisodeNumber(text: string): number {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

// ==================== ANIME LIST ENDPOINTS ====================

export async function getAnimeLatest(): Promise<Anime[]> {
  return fetchAnimeLatest();
}

export async function getAnimeRecommended(page = 1): Promise<Anime[]> {
  return fetchAnimeRecommended(page);
}

export async function getAnimeMovie(): Promise<Anime[]> {
  return fetchAnimeMovie();
}

export async function getAnimeUnlimited(): Promise<Anime[]> {
  return fetchAnimeMovie();
}

// ==================== ANIME DETAIL ====================

export async function getAnimeDetail(urlId: string): Promise<Anime | null> {
  return fetchAnimeDetail(urlId);
}

// ==================== ANIME SEARCH ====================

export async function searchAnime(query: string): Promise<Anime[]> {
  return fetchAnimeSearch(query);
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
    if (!res.ok) return { url: null, type: "direct", availableResolutions: [] };
    const data = await res.json();
    return {
      url: data.url || null,
      type: data.type || "direct",
      availableResolutions: data.availableResolutions || [],
    };
  } catch {
    return { url: null, type: "direct", availableResolutions: [] };
  }
}

export async function getAnimeEpisode(episodeId: string): Promise<RawEpisodeData | null> {
  return fetchAnimeEpisode(episodeId);
}

export async function getAnimeServerUrl(serverId: string): Promise<string | null> {
  return fetchAnimeServerUrl(serverId);
}

// ==================== ANIME SCHEDULE ====================

export async function getAnimeSchedule(): Promise<AnimeScheduleDay[]> {
  return fetchAnimeSchedule();
}

// ==================== ANIME GENRES ====================

export async function getAnimeGenres(): Promise<AnimeGenre[]> {
  return fetchAnimeGenres();
}

export async function getAnimeByGenre(slug: string, page = 1): Promise<PaginatedResult<Anime>> {
  return fetchAnimeByGenre(slug, page);
}

// ==================== ANIME BATCH ====================

export async function getAnimeBatch(slug: string): Promise<AnimeBatchDownload | null> {
  return fetchAnimeBatch(slug);
}
