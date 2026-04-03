"use client";

import { useQuery } from "@tanstack/react-query";
import { advancedSearchKomik } from "@/lib/api-client";
import { useKomikLatest } from "./useKomik";
import { useAnimeLatest } from "./useAnime";

interface ListingStats {
  total: number | null;
  updatedToday: number;
  newThisWeek: number;
  isLoading: boolean;
}

/**
 * Parse various date formats to check if it's today or within this week.
 * Handles formats like "2 jam lalu", "kemarin", "17 Jan 2025", etc.
 */
function parseRelativeDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;

  const now = new Date();
  const lower = dateStr.toLowerCase().trim();

  // "X jam lalu" / "X hours ago"
  const hoursMatch = lower.match(/(\d+)\s*(jam|hour)/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1], 10);
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }

  // "X menit lalu" / "X minutes ago"
  const minutesMatch = lower.match(/(\d+)\s*(menit|minute)/);
  if (minutesMatch) {
    const minutes = parseInt(minutesMatch[1], 10);
    return new Date(now.getTime() - minutes * 60 * 1000);
  }

  // "X hari lalu" / "X days ago"
  const daysMatch = lower.match(/(\d+)\s*(hari|day)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // "kemarin" / "yesterday"
  if (lower.includes("kemarin") || lower.includes("yesterday")) {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // "baru saja" / "just now"
  if (lower.includes("baru") || lower.includes("just")) {
    return now;
  }

  // Try to parse as regular date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function isToday(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isWithinDays(date: Date | null, days: number): boolean {
  if (!date) return false;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days && diffDays >= 0;
}

/**
 * Hook to get listing stats for komik.
 * Derives total from advanced search, updated counts from latest data.
 */
export function useKomikStats(): ListingStats {
  // Get total count via minimal advanced search query
  const { data: searchResult, isLoading: isLoadingTotal } = useQuery({
    queryKey: ["komik", "stats", "total"],
    queryFn: () => advancedSearchKomik({ limit: 1 }),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Get latest for counting recent updates
  const { data: latestData, isLoading: isLoadingLatest } = useKomikLatest();

  // Calculate stats
  let updatedToday = 0;
  let newThisWeek = 0;

  if (latestData && Array.isArray(latestData)) {
    for (const item of latestData) {
      const date = parseRelativeDate(item.updatedAt);
      if (isToday(date)) {
        updatedToday++;
      }
      if (isWithinDays(date, 7)) {
        newThisWeek++;
      }
    }
  }

  // Extract total from pagination
  const total = searchResult?.totalPages ? searchResult.totalPages * 20 : null;

  return {
    total,
    updatedToday,
    newThisWeek,
    isLoading: isLoadingTotal || isLoadingLatest,
  };
}

/**
 * Hook to get listing stats for anime.
 * Since anime API doesn't have advanced search with pagination total,
 * we derive stats from latest data only.
 */
export function useAnimeStats(): ListingStats {
  const { data: latestData, isLoading } = useAnimeLatest();

  let updatedToday = 0;
  let newThisWeek = 0;

  if (latestData && Array.isArray(latestData)) {
    for (const item of latestData) {
      const date = parseRelativeDate(item.updatedAt);
      if (isToday(date)) {
        updatedToday++;
      }
      if (isWithinDays(date, 7)) {
        newThisWeek++;
      }
    }
  }

  return {
    total: latestData?.length ? latestData.length * 50 : null, // Rough estimate
    updatedToday,
    newThisWeek,
    isLoading,
  };
}
