import { Suspense } from "react";
import { getKomikBerwarna } from "@/lib/api-client";
import { Card } from "@/components/ui";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Palette, SearchX } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Komik Berwarna Full Color Sub Indo",
  description:
    "Baca komik berwarna (full color) manhwa dan manhua sub Indonesia terlengkap. Koleksi webtoon full color dengan update terbaru setiap hari.",
  alternates: { canonical: "/komik/berwarna" },
};

async function BerwarnaResults({ page }: { page: number }) {
  let items: Awaited<ReturnType<typeof getKomikBerwarna>>;
  try {
    items = await getKomikBerwarna(page);
  } catch {
    items = [];
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="text-muted-foreground/50 mb-4 h-16 w-16" />
        <p className="text-lg font-medium">Tidak ada komik ditemukan</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((komik) => (
          <Card key={komik.manga_id} item={komik} type="komik" />
        ))}
      </div>

      {items.length >= 20 && (
        <div className="mt-8 flex justify-center gap-4">
          {page > 1 && (
            <a
              href={`/komik/berwarna?page=${page - 1}`}
              className="bg-card hover:bg-accent rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            >
              Sebelumnya
            </a>
          )}
          <a
            href={`/komik/berwarna?page=${page + 1}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Selanjutnya
          </a>
        </div>
      )}
    </>
  );
}

export default async function KomikBerwarnaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Palette className="text-primary h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Komik Berwarna</h1>
          <p className="text-muted-foreground">Koleksi komik full color</p>
        </div>
      </div>

      <Suspense fallback={<GridSkeleton count={12} />}>
        <BerwarnaResults page={page} />
      </Suspense>
    </div>
  );
}
