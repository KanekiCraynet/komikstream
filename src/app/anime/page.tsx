import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";
import type { Metadata } from "next";
import AnimePageClient from "./AnimePageClient";
import { getAnimeLatest, getAnimeRecommended, getAnimeMovie } from "@/lib/api";
import { enrichAnimeWithGenres } from "@/lib/api-cached";

export const metadata: Metadata = {
  title: "Nonton Anime Sub Indo Terlengkap & Terbaru",
  description:
    "Nonton anime subtitle Indonesia terlengkap. Streaming anime terbaru, ongoing, dan movie gratis. Update episode setiap hari dengan kualitas terbaik.",
  alternates: { canonical: "/anime" },
};

// ISR: regenerate every hour.
// Data is now server-fetched and hydrated into TanStack Query,
// so the HTML contains full content for SEO crawlers.
export const revalidate = 3600;

// Query keys must match those in useAnime.ts exactly.
// Duplicated here to avoid importing from "use client" hook modules
// which cause build errors during SSR prerendering.
const QUERY_KEYS = {
  animeLatest: ["anime", "latest"] as const,
  animeRecommended: ["anime", "recommended", 1] as const,
  animeMovies: ["anime", "movies"] as const,
};

// Wrap in Suspense for useSearchParams() in the client component
export default async function AnimePage() {
  const queryClient = makeQueryClient();

  // Prefetch default data in parallel on the server
  // (default view: latest + recommended page 1 + movies)
  await Promise.all([
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
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.animeMovies,
      queryFn: async () => {
        const data = await getAnimeMovie();
        return enrichAnimeWithGenres(data);
      },
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <AnimePageClient />
      </Suspense>
    </HydrationBoundary>
  );
}
