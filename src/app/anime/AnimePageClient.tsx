"use client";

import { useMemo } from "react";
import { Card, Pagination } from "@/components/ui";
import { GridSkeleton } from "@/components/ui/Skeleton";
import {
  FeaturedSpotlight,
  StickyFilterBar,
  DiscoveryPanel,
  RecommendationRow,
} from "@/components/listing";
import { useAnimeLatest, useAnimeRecommended, useAnimeMovies } from "@/hooks/useAnime";
import { Film, TrendingUp, Sparkles, Clapperboard, Star, Play } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Anime } from "@/types";

// ─── Filter/Sort Utilities ──────────────────────────────────────────

/**
 * Filter anime by status (ongoing, completed, etc.)
 */
function filterByStatus(anime: Anime[], status: string): Anime[] {
  if (!status) return anime;
  const normalizedStatus = status.toLowerCase();
  return anime.filter((item) => {
    const itemStatus = (item.status || "").toLowerCase();
    // Handle common variations
    if (normalizedStatus === "ongoing") {
      return itemStatus.includes("ongoing") || itemStatus.includes("airing");
    }
    if (normalizedStatus === "completed") {
      return itemStatus.includes("completed") || itemStatus.includes("finished");
    }
    return itemStatus.includes(normalizedStatus);
  });
}

/**
 * Sort anime by various criteria
 */
function sortAnime(anime: Anime[], sortBy: string): Anime[] {
  if (!sortBy || sortBy === "latest") return anime;

  const sorted = [...anime];

  if (sortBy === "rating") {
    // Sort by rating descending (highest first)
    sorted.sort((a, b) => {
      const ratingA = parseFloat(String(a.rating || "0")) || 0;
      const ratingB = parseFloat(String(b.rating || "0")) || 0;
      return ratingB - ratingA;
    });
  } else if (sortBy === "title") {
    // Sort alphabetically by title
    sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }

  return sorted;
}

/**
 * Get display title and icon for current filter/sort state
 */
function getDisplayInfo(sort: string, status: string) {
  if (status === "ongoing") {
    return {
      title: "Sedang Tayang",
      icon: Play,
      description: "Anime yang sedang tayang",
    };
  }
  if (status === "completed") {
    return {
      title: "Anime Selesai",
      icon: Clapperboard,
      description: "Anime yang sudah selesai",
    };
  }
  if (sort === "rating") {
    return {
      title: "Top Rating",
      icon: Star,
      description: "Diurutkan berdasarkan rating tertinggi",
    };
  }
  if (sort === "recommended") {
    return {
      title: "Anime Rekomendasi",
      icon: Sparkles,
      description: null,
    };
  }
  if (sort === "movie") {
    return {
      title: "Anime Movie",
      icon: Clapperboard,
      description: null,
    };
  }
  return {
    title: "Anime Terbaru",
    icon: TrendingUp,
    description: null,
  };
}

// ─── Main Grid Component ─────────────────────────────────────────────

function AnimeMainGrid({ sort, status, page }: { sort: string; status: string; page: number }) {
  // Fetch data based on filters
  const { data: latestAnime, isLoading: loadingLatest } = useAnimeLatest();
  const { data: recommendedAnime, isLoading: loadingRecommended } = useAnimeRecommended(page);
  const { data: movieAnime, isLoading: loadingMovies } = useAnimeMovies();

  // Determine which data source to use and loading state
  const isLoading = useMemo(() => {
    if (sort === "recommended") return loadingRecommended;
    if (sort === "movie") return loadingMovies;
    // For status filters or rating sort, we need latestAnime + movieAnime for comprehensive data
    if (status || sort === "rating") return loadingLatest || loadingMovies;
    return loadingLatest;
  }, [sort, status, loadingLatest, loadingRecommended, loadingMovies]);

  // Process and filter/sort the data
  const displayAnime = useMemo((): Anime[] => {
    // For recommended, use pagination from API
    if (sort === "recommended") {
      return recommendedAnime ?? [];
    }

    // For movie, use movie data
    if (sort === "movie") {
      return movieAnime ?? [];
    }

    // For status filters or rating sort, combine data sources for better coverage
    let baseData: Anime[];
    if (status || sort === "rating") {
      // Combine latest (ongoing) and movie (completed) for comprehensive filtering
      const combined = [...(latestAnime ?? []), ...(movieAnime ?? [])];
      // Deduplicate by urlId
      const seen = new Set<string>();
      baseData = combined.filter((item) => {
        if (seen.has(item.urlId)) return false;
        seen.add(item.urlId);
        return true;
      });
    } else {
      baseData = latestAnime ?? [];
    }

    // Apply status filter
    let result = status ? filterByStatus(baseData, status) : baseData;

    // Apply sorting
    result = sortAnime(result, sort);

    return result;
  }, [sort, status, latestAnime, recommendedAnime, movieAnime]);

  if (isLoading) {
    return <GridSkeleton count={18} />;
  }

  // Build current URL for pagination
  const buildPaginationUrl = () => {
    const urlParams = new URLSearchParams();
    if (sort !== "latest") urlParams.set("sort", sort);
    if (status) urlParams.set("status", status);
    const queryString = urlParams.toString();
    return queryString ? `/anime?${queryString}` : "/anime";
  };

  const estimatedTotalPages = sort === "recommended" ? 10 : 1;

  // Get display info for header
  const displayInfo = getDisplayInfo(sort, status);
  const IconComponent = displayInfo.icon;

  if (displayAnime.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Film className="mb-4 h-16 w-16 text-slate-600" />
        <p className="text-lg font-medium text-slate-300">Tidak ada anime ditemukan</p>
        <p className="text-sm text-slate-500">Coba filter atau pencarian yang berbeda</p>
      </div>
    );
  }

  return (
    <>
      {/* Section header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">{displayInfo.title}</h2>
        </div>
        {displayInfo.description && (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
            {displayInfo.description}
          </span>
        )}
        {sort === "recommended" && (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
            Halaman {page}
          </span>
        )}
        {/* Show count for filtered results */}
        {(status || sort === "rating") && (
          <span className="ml-auto text-sm text-slate-500">{displayAnime.length} anime</span>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
        {displayAnime.map((anime: Anime, index: number) => (
          <Card key={anime.urlId} item={anime} type="anime" index={index} />
        ))}
      </div>

      {/* Pagination */}
      {sort === "recommended" && (
        <Pagination
          currentPage={page}
          totalPages={estimatedTotalPages}
          baseUrl={buildPaginationUrl()}
          className="mt-10"
        />
      )}
    </>
  );
}

// ─── Page Component ─────────────────────────────────────────────────

export default function AnimePageClient() {
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") || "latest";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  // Data for spotlight and recommendations
  const { data: latestAnime } = useAnimeLatest();
  const { data: recommendedAnime } = useAnimeRecommended(1);
  const { data: movieAnime } = useAnimeMovies();

  // Spotlight items - use recommended or latest
  const spotlightItems = (recommendedAnime ?? latestAnime ?? []).slice(0, 5);

  // Trending items for sidebar - prioritize recommended
  const trendingItems = (recommendedAnime ?? latestAnime ?? []).slice(0, 5);

  // Movie items for recommendation row
  const movieItems = (movieAnime ?? []).slice(0, 12);

  // Recommendation items - different from main grid
  const recommendationItems = (recommendedAnime ?? latestAnime ?? []).slice(0, 12);

  // Determine if we should show additional rows (only when viewing default/latest without filters)
  const showAdditionalRows = sort === "latest" && !status;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Featured Spotlight - Full width, no container */}
      <FeaturedSpotlight items={spotlightItems} variant="anime" autoRotateInterval={8000} />

      {/* Sticky Filter Bar */}
      <StickyFilterBar variant="anime" />

      {/* Main Content */}
      <div className="mx-auto max-w-screen-2xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main Content Area */}
          <main className="min-w-0 flex-1">
            {/* Main Grid */}
            <AnimeMainGrid sort={sort} status={status} page={page} />

            {/* Movie Row - Show when viewing default view without filters */}
            {showAdditionalRows && movieItems.length > 0 && (
              <div className="mt-12 border-t border-slate-800/50 pt-8">
                <RecommendationRow title="Anime Movie" items={movieItems} variant="anime" />
              </div>
            )}

            {/* Recommendation Row - Show when viewing default view */}
            {showAdditionalRows && recommendationItems.length > 0 && (
              <div className="mt-12 border-t border-slate-800/50 pt-8">
                <RecommendationRow
                  title="Rekomendasi Untukmu"
                  items={recommendationItems}
                  variant="anime"
                />
              </div>
            )}
          </main>

          {/* Sidebar - Discovery Panel */}
          <aside className="w-full shrink-0 lg:w-72 xl:w-80">
            <div className="sticky top-20">
              <DiscoveryPanel variant="anime" trendingItems={trendingItems} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
