import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";
import { HomePageContent } from "@/components/home";
import { getKomikLatest, getKomikPopular, getAnimeLatest, getAnimeRecommended } from "@/lib/api";
import { enrichKomikWithGenres, enrichAnimeWithGenres } from "@/lib/api-cached";
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

// Query keys must match those in useKomik.ts / useAnime.ts exactly.
// Duplicated here to avoid importing from "use client" hook modules
// which cause build errors during SSR prerendering.
const QUERY_KEYS = {
  komikLatest: ["komik", "latest", "mirror"] as const,
  komikPopular: ["komik", "popular", 1] as const,
  animeLatest: ["anime", "latest"] as const,
  animeRecommended: ["anime", "recommended", 1] as const,
};

export default async function HomePage() {
  const queryClient = makeQueryClient();

  // Prefetch all homepage data in parallel on the server
  // Enrich list items with genres from DB cache for filter functionality
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.komikLatest,
      queryFn: async () => {
        const data = await getKomikLatest("mirror");
        return enrichKomikWithGenres(data);
      },
    }),
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.komikPopular,
      queryFn: async () => {
        const data = await getKomikPopular(1);
        return enrichKomikWithGenres(data);
      },
    }),
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.animeLatest,
      queryFn: async () => {
        const data = await getAnimeLatest();
        return enrichAnimeWithGenres(data);
      },
    }),
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.animeRecommended,
      queryFn: async () => {
        const data = await getAnimeRecommended(1);
        return enrichAnimeWithGenres(data);
      },
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePageContent />
    </HydrationBoundary>
  );
}
