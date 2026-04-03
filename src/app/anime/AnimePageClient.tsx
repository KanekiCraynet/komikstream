"use client";

import { Card, Pagination } from "@/components/ui";
import { GridSkeleton } from "@/components/ui/Skeleton";
import {
  FeaturedSpotlight,
  StickyFilterBar,
  DiscoveryPanel,
  RecommendationRow,
} from "@/components/listing";
import { useAnimeLatest, useAnimeRecommended, useAnimeMovies } from "@/hooks/useAnime";
import { Film, TrendingUp, Sparkles, Clapperboard } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Anime } from "@/types";

// ─── Main Grid Component ─────────────────────────────────────────────

function AnimeMainGrid({ sort, page }: { sort: string; page: number }) {
  // Fetch data based on filters
  const { data: latestAnime, isLoading: loadingLatest } = useAnimeLatest();
  const { data: recommendedAnime, isLoading: loadingRecommended } = useAnimeRecommended(page);
  const { data: movieAnime, isLoading: loadingMovies } = useAnimeMovies();

  const isLoading =
    sort === "recommended" ? loadingRecommended : sort === "movie" ? loadingMovies : loadingLatest;

  if (isLoading) {
    return <GridSkeleton count={18} />;
  }

  // Determine display data based on filters
  const displayAnime: Anime[] =
    sort === "recommended"
      ? (recommendedAnime ?? [])
      : sort === "movie"
        ? (movieAnime ?? [])
        : (latestAnime ?? []);

  // Build current URL for pagination
  const buildPaginationUrl = () => {
    const urlParams = new URLSearchParams();
    if (sort !== "latest") urlParams.set("sort", sort);
    const queryString = urlParams.toString();
    return queryString ? `/anime?${queryString}` : "/anime";
  };

  const estimatedTotalPages = sort === "recommended" ? 10 : 1;

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
          {sort === "recommended" ? (
            <Sparkles className="h-5 w-5 text-blue-400" />
          ) : sort === "movie" ? (
            <Clapperboard className="h-5 w-5 text-blue-400" />
          ) : (
            <TrendingUp className="h-5 w-5 text-blue-400" />
          )}
          <h2 className="text-xl font-bold text-white">
            {sort === "recommended"
              ? "Anime Rekomendasi"
              : sort === "movie"
                ? "Anime Movie"
                : "Anime Terbaru"}
          </h2>
        </div>
        {sort === "recommended" && (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
            Halaman {page}
          </span>
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
            <AnimeMainGrid sort={sort} page={page} />

            {/* Movie Row - Show when not viewing movies */}
            {sort !== "movie" && movieItems.length > 0 && (
              <div className="mt-12 border-t border-slate-800/50 pt-8">
                <RecommendationRow title="Anime Movie" items={movieItems} variant="anime" />
              </div>
            )}

            {/* Recommendation Row - Show when viewing latest */}
            {sort === "latest" && recommendationItems.length > 0 && (
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
