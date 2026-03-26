"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getAnimeLatest,
  getAnimeRecommended,
  getAnimeMovie,
  searchAnime,
  getAnimeDetail,
  getAnimeVideo,
  getAnimeSchedule,
  getAnimeGenres,
  getAnimeByGenre,
  getAnimeBatch,
} from "@/lib/api-client";

// Video resolution type
export type VideoResolution = "360p" | "480p" | "720p" | "1080p";

// Query keys for cache management
export const animeKeys = {
  all: ["anime"] as const,
  latest: () => [...animeKeys.all, "latest"] as const,
  recommended: (page: number) => [...animeKeys.all, "recommended", page] as const,
  recommendedInfinite: () => [...animeKeys.all, "recommended", "infinite"] as const,
  movies: () => [...animeKeys.all, "movies"] as const,
  search: (query: string) => [...animeKeys.all, "search", query] as const,
  detail: (urlId: string) => [...animeKeys.all, "detail", urlId] as const,
  video: (episodeId: string, resolution: VideoResolution) =>
    [...animeKeys.all, "video", episodeId, resolution] as const,
  schedule: () => [...animeKeys.all, "schedule"] as const,
  genres: () => [...animeKeys.all, "genres"] as const,
  byGenre: (slug: string, page: number) => [...animeKeys.all, "genre", slug, page] as const,
  batch: (slug: string) => [...animeKeys.all, "batch", slug] as const,
};

// Hook for fetching latest anime
export function useAnimeLatest() {
  return useQuery({
    queryKey: animeKeys.latest(),
    queryFn: getAnimeLatest,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching recommended anime with pagination
export function useAnimeRecommended(page: number = 1) {
  return useQuery({
    queryKey: animeKeys.recommended(page),
    queryFn: () => getAnimeRecommended(page),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for infinite scroll recommended anime
export function useAnimeRecommendedInfinite() {
  return useInfiniteQuery({
    queryKey: animeKeys.recommendedInfinite(),
    queryFn: ({ pageParam = 1 }) => getAnimeRecommended(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length > 0) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for fetching anime movies
export function useAnimeMovies() {
  return useQuery({
    queryKey: animeKeys.movies(),
    queryFn: getAnimeMovie,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for searching anime
export function useAnimeSearch(query: string) {
  return useQuery({
    queryKey: animeKeys.search(query),
    queryFn: () => searchAnime(query),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching anime detail
export function useAnimeDetail(urlId: string) {
  return useQuery({
    queryKey: animeKeys.detail(urlId),
    queryFn: () => getAnimeDetail(urlId),
    enabled: !!urlId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for fetching anime video
export function useAnimeVideo(episodeId: string, resolution: VideoResolution = "480p") {
  return useQuery({
    queryKey: animeKeys.video(episodeId, resolution),
    queryFn: () => getAnimeVideo(episodeId, resolution),
    enabled: !!episodeId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hook for fetching anime schedule
export function useAnimeSchedule() {
  return useQuery({
    queryKey: animeKeys.schedule(),
    queryFn: getAnimeSchedule,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook for fetching all anime genres
export function useAnimeGenres() {
  return useQuery({
    queryKey: animeKeys.genres(),
    queryFn: getAnimeGenres,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — genres rarely change
  });
}

// Hook for fetching anime by genre with pagination
export function useAnimeByGenre(slug: string, page: number = 1) {
  return useQuery({
    queryKey: animeKeys.byGenre(slug, page),
    queryFn: () => getAnimeByGenre(slug, page),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for fetching anime batch download links
export function useAnimeBatch(slug: string) {
  return useQuery({
    queryKey: animeKeys.batch(slug),
    queryFn: () => getAnimeBatch(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}
