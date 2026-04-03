"use client";

import { Card, Pagination } from "@/components/ui";
import { GridSkeleton } from "@/components/ui/Skeleton";
import {
  FeaturedSpotlight,
  StickyFilterBar,
  DiscoveryPanel,
  RecommendationRow,
} from "@/components/listing";
import { useKomikLatest, useKomikPopular, useKomikRecommended } from "@/hooks/useKomik";
import type { KomikType } from "@/hooks/useKomik";
import { Book, TrendingUp, Sparkles, Filter } from "lucide-react";
import { useSearchParams } from "next/navigation";

// ─── Main Grid Component ─────────────────────────────────────────────

function KomikMainGrid({ type, sort, page }: { type?: KomikType; sort: string; page: number }) {
  // Fetch data based on filters
  const { data: latestKomik, isLoading: loadingLatest } = useKomikLatest("mirror");
  const { data: popularKomik, isLoading: loadingPopular } = useKomikPopular(page);
  const { data: recommendedKomik, isLoading: loadingRecommended } = useKomikRecommended(
    type || "manhwa"
  );

  const isLoading = type ? loadingRecommended : sort === "popular" ? loadingPopular : loadingLatest;

  if (isLoading) {
    return <GridSkeleton count={18} />;
  }

  // Determine display data based on filters
  let displayKomik = sort === "popular" ? (popularKomik ?? []) : (latestKomik ?? []);

  if (type) {
    displayKomik = recommendedKomik ?? [];
  }

  // Build current URL for pagination
  const buildPaginationUrl = () => {
    const urlParams = new URLSearchParams();
    if (type) urlParams.set("type", type);
    if (sort !== "latest") urlParams.set("sort", sort);
    const queryString = urlParams.toString();
    return queryString ? `/komik?${queryString}` : "/komik";
  };

  const estimatedTotalPages = sort === "popular" ? 10 : 1;

  if (displayKomik.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Book className="mb-4 h-16 w-16 text-slate-600" />
        <p className="text-lg font-medium text-slate-300">Tidak ada komik ditemukan</p>
        <p className="text-sm text-slate-500">Coba filter atau pencarian yang berbeda</p>
      </div>
    );
  }

  return (
    <>
      {/* Section header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {sort === "popular" ? (
            <TrendingUp className="h-5 w-5 text-amber-400" />
          ) : type ? (
            <Filter className="h-5 w-5 text-amber-400" />
          ) : (
            <Sparkles className="h-5 w-5 text-amber-400" />
          )}
          <h2 className="text-xl font-bold text-white">
            {type
              ? `Rekomendasi ${type.charAt(0).toUpperCase() + type.slice(1)}`
              : sort === "popular"
                ? "Komik Populer"
                : "Komik Terbaru"}
          </h2>
        </div>
        {(sort === "popular" || type) && (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
            Halaman {page}
          </span>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
        {displayKomik.map((komik, index) => (
          <Card key={komik.manga_id} item={komik} type="komik" index={index} />
        ))}
      </div>

      {/* Pagination */}
      {(sort === "popular" || type) && (
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

export default function KomikPageClient() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as KomikType | null;
  const sort = searchParams.get("sort") || "latest";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  // Data for spotlight and recommendations
  const { data: latestKomik } = useKomikLatest("mirror");
  const { data: popularKomik } = useKomikPopular(1);
  const { data: recommendedKomik } = useKomikRecommended("manhwa");

  // Spotlight items - use popular or latest
  const spotlightItems = (popularKomik ?? latestKomik ?? []).slice(0, 5);

  // Trending items for sidebar - prioritize popular
  const trendingItems = (popularKomik ?? []).slice(0, 5);

  // Recommendation items - different from main grid
  const recommendationItems = (recommendedKomik ?? latestKomik ?? []).slice(0, 12);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Featured Spotlight - Full width, no container */}
      <FeaturedSpotlight items={spotlightItems} variant="komik" autoRotateInterval={8000} />

      {/* Sticky Filter Bar */}
      <StickyFilterBar variant="komik" />

      {/* Main Content */}
      <div className="mx-auto max-w-screen-2xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main Content Area */}
          <main className="min-w-0 flex-1">
            {/* Main Grid */}
            <KomikMainGrid type={type ?? undefined} sort={sort} page={page} />

            {/* Recommendation Row - Show when not filtered */}
            {!type && sort === "latest" && recommendationItems.length > 0 && (
              <div className="mt-12 border-t border-slate-800/50 pt-8">
                <RecommendationRow
                  title="Rekomendasi Untukmu"
                  items={recommendationItems}
                  variant="komik"
                />
              </div>
            )}

            {/* Popular Section - Show when viewing latest */}
            {sort !== "popular" && !type && (popularKomik ?? []).length > 0 && (
              <div className="mt-12 border-t border-slate-800/50 pt-8">
                <RecommendationRow
                  title="Komik Populer"
                  items={(popularKomik ?? []).slice(0, 12)}
                  variant="komik"
                />
              </div>
            )}
          </main>

          {/* Sidebar - Discovery Panel */}
          <aside className="w-full shrink-0 lg:w-72 xl:w-80">
            <div className="sticky top-20">
              <DiscoveryPanel variant="komik" trendingItems={trendingItems} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
