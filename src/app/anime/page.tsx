import { Suspense } from "react";
import type { Metadata } from "next";
import AnimePageClient from "./AnimePageClient";

export const metadata: Metadata = {
  title: "Nonton Anime Sub Indo Terlengkap & Terbaru",
  description:
    "Nonton anime subtitle Indonesia terlengkap. Streaming anime terbaru, ongoing, dan movie gratis. Update episode setiap hari dengan kualitas terbaik.",
  alternates: { canonical: "/anime" },
};

// ISR: regenerate the static shell every hour.
// Actual data is fetched client-side via TanStack Query hooks.
export const revalidate = 3600;

// Wrap in Suspense for useSearchParams() in the client component
export default function AnimePage() {
  return (
    <Suspense>
      <AnimePageClient />
    </Suspense>
  );
}
