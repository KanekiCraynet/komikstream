"use client";

import { HeroCarousel } from "./HeroCarousel";
import { HomeSidebar } from "./HomeSidebar";
import { UpdateTerbaruSection, OngoingSection, CompletedSection } from "./sections";
import { useKomikLatest, useKomikPopular } from "@/hooks/useKomik";
import { useAnimeLatest, useAnimeRecommended } from "@/hooks/useAnime";
import type { Komik, Anime } from "@/types";

// Type for featured items in the hero carousel
type FeaturedItem = (Komik | Anime) & { itemType: "komik" | "anime" };

export function HomePageContent() {
  // Fetch data using hooks (will be hydrated from server)
  const { data: komikLatest, isLoading: isKomikLatestLoading } = useKomikLatest();
  const { data: komikPopular, isLoading: isKomikPopularLoading } = useKomikPopular();
  const { data: animeLatest, isLoading: isAnimeLatestLoading } = useAnimeLatest();
  const { data: animeRecommended, isLoading: isAnimeRecommendedLoading } = useAnimeRecommended();

  // Create featured items for carousel (mix of top komik and anime)
  const featuredItems: FeaturedItem[] = [
    // Take top 2 from komik popular
    ...(komikPopular || []).slice(0, 2).map(
      (k): FeaturedItem => ({
        ...k,
        itemType: "komik",
      })
    ),
    // Take top 2 from anime recommended
    ...(animeRecommended || []).slice(0, 2).map(
      (a): FeaturedItem => ({
        ...a,
        itemType: "anime",
      })
    ),
    // Add 1 more komik if available
    ...(komikPopular || []).slice(2, 3).map(
      (k): FeaturedItem => ({
        ...k,
        itemType: "komik",
      })
    ),
  ];

  // Create ranking items for sidebar (mix of popular komik and anime)
  // Use stable scoring based on item properties instead of Math.random()
  const rankingItems = [
    ...(komikPopular || []).slice(0, 3).map((k, idx) => ({
      ...k,
      itemType: "komik" as const,
      points: k.rating ? Math.floor(parseFloat(String(k.rating)) * 10) : 50 - idx * 10,
    })),
    ...(animeRecommended || []).slice(0, 2).map((a, idx) => ({
      ...a,
      itemType: "anime" as const,
      points: a.rating ? Math.floor(parseFloat(String(a.rating)) * 10) : 45 - idx * 10,
    })),
  ].sort((a, b) => (b.points || 0) - (a.points || 0));

  const isLoading =
    isKomikLatestLoading ||
    isKomikPopularLoading ||
    isAnimeLatestLoading ||
    isAnimeRecommendedLoading;

  return (
    <div className="flex flex-col">
      {/* Hero Carousel */}
      <HeroCarousel items={featuredItems} />

      {/* Main Content Area with Sidebar */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main Content */}
          <main className="min-w-0 flex-1">
            {/* Update Terbaru with Category Filter */}
            <UpdateTerbaruSection
              komikData={komikLatest}
              animeData={animeLatest}
              isLoading={isLoading}
            />

            {/* Komik Ongoing - Horizontal scroll */}
            <OngoingSection
              title="Komik Ongoing"
              items={komikLatest || []}
              type="komik"
              href="/komik?status=ongoing"
              isLoading={isKomikLatestLoading}
            />

            {/* Anime Ongoing - Horizontal scroll */}
            <OngoingSection
              title="Anime Ongoing"
              items={animeLatest || []}
              type="anime"
              href="/anime?status=ongoing"
              isLoading={isAnimeLatestLoading}
            />

            {/* Komik Tamat (Completed) */}
            <CompletedSection
              title="Komik Tamat"
              items={komikPopular || []}
              type="komik"
              href="/komik"
              isLoading={isKomikPopularLoading}
            />
          </main>

          {/* Sidebar - Hidden on mobile, vertical on lg+ */}
          <aside className="hidden lg:block lg:w-64 lg:shrink-0">
            <div className="sticky top-24">
              <HomeSidebar rankingItems={rankingItems} />
            </div>
          </aside>
        </div>

        {/* Tablet Sidebar - Horizontal layout at md breakpoint */}
        <div className="mt-8 hidden md:block lg:hidden">
          <HomeSidebar rankingItems={rankingItems} variant="horizontal" />
        </div>
      </div>
    </div>
  );
}
