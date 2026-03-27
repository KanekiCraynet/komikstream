import { Suspense } from "react";
import type { Metadata } from "next";
import KomikPageClient from "./KomikPageClient";

export const metadata: Metadata = {
  title: "Baca Komik Manga, Manhwa & Manhua Sub Indo Terbaru",
  description:
    "Baca komik manga, manhwa, dan manhua sub Indonesia terlengkap. Update chapter terbaru setiap hari, gratis tanpa iklan pop-up. Koleksi 10.000+ judul populer.",
  alternates: { canonical: "/komik" },
};

// ISR: regenerate the static shell every hour.
// Actual data is fetched client-side via TanStack Query hooks.
export const revalidate = 3600;

// Wrap in Suspense for useSearchParams() in the client component
export default function KomikPage() {
  return (
    <Suspense>
      <KomikPageClient />
    </Suspense>
  );
}
