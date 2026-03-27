import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";
import {
  HeroSection,
  KomikLatestSection,
  KomikPopularSection,
  AnimeLatestSection,
  AnimeRecommendedSection,
} from "@/components/home";
import { komikKeys } from "@/hooks/useKomik";
import { animeKeys } from "@/hooks/useAnime";
import {
  getKomikLatest,
  getKomikPopular,
  getAnimeLatest,
  getAnimeRecommended,
} from "@/lib/api-client";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: siteConfig.url,
  },
};

// ISR: regenerate every hour.
// Data is now server-fetched and hydrated into TanStack Query,
// so the HTML contains full content for SEO crawlers.
export const revalidate = 3600;

export default async function HomePage() {
  const queryClient = makeQueryClient();

  // Prefetch all homepage data in parallel on the server
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: komikKeys.latest("mirror"),
      queryFn: () => getKomikLatest("mirror"),
    }),
    queryClient.prefetchQuery({
      queryKey: komikKeys.popular(1),
      queryFn: () => getKomikPopular(1),
    }),
    queryClient.prefetchQuery({
      queryKey: animeKeys.latest(),
      queryFn: () => getAnimeLatest(),
    }),
    queryClient.prefetchQuery({
      queryKey: animeKeys.recommended(1),
      queryFn: () => getAnimeRecommended(1),
    }),
  ]);

  return (
    <div className="flex flex-col">
      <HeroSection />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <KomikLatestSection />
        <AnimeLatestSection />
        <KomikPopularSection />
        <AnimeRecommendedSection />
      </HydrationBoundary>
    </div>
  );
}
