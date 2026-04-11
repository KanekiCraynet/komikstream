import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";
import type { Metadata } from "next";
import KomikPageClient from "./KomikPageClient";
import { getKomikLatest, getKomikPopular, getKomikRecommended } from "@/lib/api";
import { enrichKomikWithGenres } from "@/lib/api-cached";

export const metadata: Metadata = {
  title: "Baca Komik Manga, Manhwa & Manhua Sub Indo Terbaru",
  description:
    "Baca komik manga, manhwa, dan manhua sub Indonesia terlengkap. Update chapter terbaru setiap hari, gratis tanpa iklan pop-up. Koleksi 10.000+ judul populer.",
  alternates: { canonical: "/komik" },
};

// ISR: regenerate every hour.
// Data is now server-fetched and hydrated into TanStack Query,
// so the HTML contains full content for SEO crawlers.
export const revalidate = 3600;

// Query keys must match those in useKomik.ts exactly.
// Duplicated here to avoid importing from "use client" hook modules
// which cause build errors during SSR prerendering.
const QUERY_KEYS = {
  komikLatest: ["komik", "latest", "mirror"] as const,
  komikPopular: ["komik", "popular", 1] as const,
  komikRecommended: ["komik", "recommended", "manhwa"] as const,
};

// Wrap in Suspense for useSearchParams() in the client component
export default async function KomikPage() {
  const queryClient = makeQueryClient();

  // Prefetch default data in parallel on the server
  // (default view: latest + popular + recommended manhwa)
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
      queryKey: QUERY_KEYS.komikRecommended,
      queryFn: async () => {
        const data = await getKomikRecommended("manhwa");
        return enrichKomikWithGenres(data);
      },
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <KomikPageClient />
      </Suspense>
    </HydrationBoundary>
  );
}
