/**
 * Sansekai Anime API
 *
 * Fetches anime data from api.sansekai.my.id and maps to internal types.
 * Replaces the Otakudesu HTML scraper.
 */

import type {
  Anime,
  AnimeEpisode,
  AnimeGenre,
  AnimeScheduleDay,
  AnimeBatchDownload,
  PaginatedResult,
} from "@/types";
import type { RawEpisodeData, RawQualityItem, RawServerItem } from "../types";
import { CACHE_TIMES } from "@/lib/cache-config";
import { fetchSansekai } from "./client";

// ─── Sansekai Response Shapes ────────────────────────────────────────────────

interface SansekaiAnimeListItem {
  id: number | string;
  url: string;
  judul: string;
  cover: string;
  lastch: string;
  lastup: string;
}

interface SansekaiAnimeRichItem extends SansekaiAnimeListItem {
  genre: string[];
  sinopsis: string;
  studio: string;
  score: string;
  status: string;
  rilis: string;
  total_episode: number;
}

interface SansekaiAnimeDetail {
  id: number;
  series_id: string;
  cover: string;
  judul: string;
  type: string;
  status: string;
  rating: string;
  published: string;
  author: string;
  genre: string[];
  genreurl: string[];
  sinopsis: string;
  chapter: SansekaiEpisodeItem[];
}

interface SansekaiEpisodeItem {
  id: number;
  ch: string;
  url: string;
  date: string;
  views: number;
}

interface SansekaiVideoData {
  episode_id: number;
  reso: string[];
  stream: Array<{ reso: string; link: string; provide: number; id: number }>;
}

interface SansekaiSearchResponse {
  data: Array<{ jumlah: number; result: SansekaiAnimeRichItem[] }>;
}

// ─── Mapping Helpers ─────────────────────────────────────────────────────────

function cleanUrlId(url: string): string {
  return url.replace(/\/+$/, "");
}

function mapListItem(item: SansekaiAnimeListItem): Anime {
  return {
    urlId: cleanUrlId(item.url),
    title: item.judul,
    thumbnail: item.cover,
  };
}

function mapRichItem(item: SansekaiAnimeRichItem): Anime {
  return {
    urlId: cleanUrlId(item.url),
    title: item.judul,
    thumbnail: item.cover,
    genres: item.genre?.filter((g) => g.trim()) ?? [],
    synopsis: item.sinopsis,
    studio: item.studio,
    rating: item.score ? parseFloat(item.score) || undefined : undefined,
    status: item.status,
    totalEpisodes: item.total_episode || undefined,
  };
}

function mapDetail(d: SansekaiAnimeDetail): Anime {
  const episodes: AnimeEpisode[] = (d.chapter ?? []).map((ch) => ({
    episodeId: ch.url,
    title: `Episode ${ch.ch}`,
    episode: ch.ch,
    date: ch.date,
  }));

  return {
    urlId: d.series_id,
    title: d.judul,
    thumbnail: d.cover,
    cover: d.cover,
    type: d.type,
    status: d.status,
    rating: d.rating ? parseFloat(d.rating) || undefined : undefined,
    studio: d.author,
    genres: d.genre ?? [],
    synopsis: d.sinopsis,
    episodes,
    totalEpisodes: episodes.length,
  };
}

function mapVideoToEpisodeData(v: SansekaiVideoData, episodeId: string): RawEpisodeData {
  const qualityMap = new Map<string, RawServerItem[]>();
  for (const s of v.stream) {
    const list = qualityMap.get(s.reso) ?? [];
    list.push({ title: `Server ${s.provide}`, serverId: s.link });
    qualityMap.set(s.reso, list);
  }

  const qualities: RawQualityItem[] = v.reso.map((r) => ({
    title: r,
    serverList: qualityMap.get(r) ?? [],
  }));

  return {
    title: episodeId,
    defaultStreamingUrl: v.stream[0]?.link ?? undefined,
    server: { qualities },
  };
}

// ─── Exported Fetch Functions ────────────────────────────────────────────────

export async function fetchAnimeLatest(): Promise<Anime[]> {
  const data = await fetchSansekai<SansekaiAnimeListItem[]>("/anime/latest", CACHE_TIMES.LATEST);
  return (data ?? []).map(mapListItem);
}

export async function fetchAnimeRecommended(page = 1): Promise<Anime[]> {
  const data = await fetchSansekai<SansekaiAnimeRichItem[]>(
    `/anime/recommended?page=${page}`,
    CACHE_TIMES.POPULAR
  );
  return (data ?? []).map(mapRichItem);
}

export async function fetchAnimeMovie(): Promise<Anime[]> {
  const data = await fetchSansekai<SansekaiAnimeListItem[]>("/anime/movie", CACHE_TIMES.POPULAR);
  return (data ?? []).map(mapListItem);
}

export async function fetchAnimeSearch(query: string): Promise<Anime[]> {
  const res = await fetchSansekai<SansekaiSearchResponse>(
    `/anime/search?query=${encodeURIComponent(query)}`,
    CACHE_TIMES.SEARCH
  );
  const results = res?.data?.[0]?.result ?? [];
  return results.map(mapRichItem);
}

export async function fetchAnimeDetail(urlId: string): Promise<Anime | null> {
  const res = await fetchSansekai<{ data: SansekaiAnimeDetail[] }>(
    `/anime/detail?urlId=${encodeURIComponent(urlId)}`,
    CACHE_TIMES.DETAIL
  );
  const d = res?.data?.[0];
  if (!d?.judul) return null;
  return mapDetail(d);
}

export async function fetchAnimeEpisode(
  episodeId: string,
  reso?: string
): Promise<RawEpisodeData | null> {
  const resoParam = reso ? `&reso=${encodeURIComponent(reso)}` : "";
  const res = await fetchSansekai<{ data: SansekaiVideoData[] }>(
    `/anime/getvideo?chapterUrlId=${encodeURIComponent(episodeId)}${resoParam}`,
    CACHE_TIMES.SEARCH
  );
  const v = res?.data?.[0];
  if (!v?.stream?.length) return null;
  return mapVideoToEpisodeData(v, episodeId);
}

export async function fetchAnimeServerUrl(serverId: string): Promise<string | null> {
  // Sansekai stores direct MP4 URLs as serverId — passthrough
  return serverId || null;
}

// ─── Stubs (no Sansekai equivalent) ──────────────────────────────────────────

export async function fetchAnimeSchedule(): Promise<AnimeScheduleDay[]> {
  return [];
}

export async function fetchAnimeGenres(): Promise<AnimeGenre[]> {
  return [];
}

export async function fetchAnimeByGenre(_slug: string, _page = 1): Promise<PaginatedResult<Anime>> {
  return { items: [], hasNextPage: false, totalPages: 0 };
}

export async function fetchAnimeBatch(_slug: string): Promise<AnimeBatchDownload | null> {
  return null;
}
