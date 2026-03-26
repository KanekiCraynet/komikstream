"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getKomikLatest,
  getKomikRecommended,
  getKomikPopular,
  searchKomik,
  getKomikDetail,
  getKomikChapterList,
  getKomikImages,
  getKomikBerwarna,
  getKomikPustaka,
  getKomikByGenre,
  advancedSearchKomik,
  getKomikScroll,
} from "@/lib/api-client";
import type { KomikAdvancedSearchParams } from "@/lib/api-client";

// Komik type for recommendations
export type KomikType = "manhwa" | "manhua" | "manga";
export type LatestType = "project" | "mirror";

// Query keys for cache management
export const komikKeys = {
  all: ["komik"] as const,
  latest: (type?: LatestType) => [...komikKeys.all, "latest", type] as const,
  recommended: (type: KomikType) => [...komikKeys.all, "recommended", type] as const,
  popular: (page: number) => [...komikKeys.all, "popular", page] as const,
  popularInfinite: () => [...komikKeys.all, "popular", "infinite"] as const,
  search: (query: string) => [...komikKeys.all, "search", query] as const,
  detail: (mangaId: string) => [...komikKeys.all, "detail", mangaId] as const,
  chapters: (mangaId: string) => [...komikKeys.all, "chapters", mangaId] as const,
  images: (chapterId: string) => [...komikKeys.all, "images", chapterId] as const,
  berwarna: (page: number) => [...komikKeys.all, "berwarna", page] as const,
  pustaka: (page: number) => [...komikKeys.all, "pustaka", page] as const,
  byGenre: (genre: string, page: number) => [...komikKeys.all, "genre", genre, page] as const,
  advancedSearch: (params: KomikAdvancedSearchParams) =>
    [...komikKeys.all, "advanced-search", params] as const,
  scroll: (seed: string, type: string) => [...komikKeys.all, "scroll", seed, type] as const,
};

// Hook for fetching latest komik
export function useKomikLatest(type: LatestType = "mirror") {
  return useQuery({
    queryKey: komikKeys.latest(type),
    queryFn: () => getKomikLatest(type),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching recommended komik by type
export function useKomikRecommended(type: KomikType) {
  return useQuery({
    queryKey: komikKeys.recommended(type),
    queryFn: () => getKomikRecommended(type),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching popular komik with pagination
export function useKomikPopular(page: number = 1) {
  return useQuery({
    queryKey: komikKeys.popular(page),
    queryFn: () => getKomikPopular(page),
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for infinite scroll popular komik
export function useKomikPopularInfinite() {
  return useInfiniteQuery({
    queryKey: komikKeys.popularInfinite(),
    queryFn: ({ pageParam = 1 }) => getKomikPopular(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Assume there's more if we got results
      if (lastPage.length > 0) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for searching komik
export function useKomikSearch(query: string) {
  return useQuery({
    queryKey: komikKeys.search(query),
    queryFn: () => searchKomik(query),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching komik detail
export function useKomikDetail(mangaId: string) {
  return useQuery({
    queryKey: komikKeys.detail(mangaId),
    queryFn: () => getKomikDetail(mangaId),
    enabled: !!mangaId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for fetching komik chapter list
export function useKomikChapters(mangaId: string) {
  return useQuery({
    queryKey: komikKeys.chapters(mangaId),
    queryFn: () => getKomikChapterList(mangaId),
    enabled: !!mangaId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook for fetching chapter images
export function useChapterImages(chapterId: string) {
  return useQuery({
    queryKey: komikKeys.images(chapterId),
    queryFn: () => getKomikImages(chapterId),
    enabled: !!chapterId,
    staleTime: 60 * 60 * 1000, // 1 hour (images don't change)
  });
}

// Hook for fetching colored comics (berwarna)
export function useKomikBerwarna(page: number = 1) {
  return useQuery({
    queryKey: komikKeys.berwarna(page),
    queryFn: () => getKomikBerwarna(page),
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for fetching library comics (pustaka)
export function useKomikPustaka(page: number = 1) {
  return useQuery({
    queryKey: komikKeys.pustaka(page),
    queryFn: () => getKomikPustaka(page),
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for fetching komik by genre with pagination
export function useKomikByGenre(genre: string, page: number = 1) {
  return useQuery({
    queryKey: komikKeys.byGenre(genre, page),
    queryFn: () => getKomikByGenre(genre, page),
    enabled: !!genre,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for advanced komik search
export function useKomikAdvancedSearch(params: KomikAdvancedSearchParams) {
  return useQuery({
    queryKey: komikKeys.advancedSearch(params),
    queryFn: () => advancedSearchKomik(params),
    enabled: !!(params.q || params.genre || params.type || params.status),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for infinite scroll komik
export function useKomikScroll(seed: string = "", type: string = "mixed") {
  return useInfiniteQuery({
    queryKey: komikKeys.scroll(seed, type),
    queryFn: ({ pageParam = 0 }) =>
      getKomikScroll({ offset: pageParam, batch_size: 20, seed, type }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 5 * 60 * 1000,
  });
}
