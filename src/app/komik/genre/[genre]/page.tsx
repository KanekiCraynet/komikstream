import { Suspense } from "react";
import { getKomikByGenre } from "@/lib/api-client";
import { Card } from "@/components/ui";
import { Pagination } from "@/components/ui/Pagination";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Tags, SearchX } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ genre: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre } = await params;
  const title = genre.charAt(0).toUpperCase() + genre.slice(1).replace(/-/g, " ");
  return {
    title: `Komik Genre: ${title}`,
    description: `Daftar komik dengan genre ${title}`,
  };
}

async function GenreResults({ genre, page }: { genre: string; page: number }) {
  let result: Awaited<ReturnType<typeof getKomikByGenre>>;
  try {
    result = await getKomikByGenre(genre, page);
  } catch {
    result = { items: [], hasNextPage: false, totalPages: 0 };
  }
  const title = genre.charAt(0).toUpperCase() + genre.slice(1).replace(/-/g, " ");

  if (result.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="text-muted-foreground/50 mb-4 h-16 w-16" />
        <p className="text-lg font-medium">Tidak ada komik ditemukan</p>
        <p className="text-muted-foreground text-sm">
          Genre &quot;{title}&quot; belum memiliki komik
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">
        Menampilkan komik genre <span className="text-foreground font-medium">{title}</span>
        {result.totalPages > 1 && (
          <>
            {" "}
            &mdash; Halaman {page} dari {result.totalPages}
          </>
        )}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {result.items.map((komik) => (
          <Card key={komik.manga_id} item={komik} type="komik" />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={result.totalPages}
        baseUrl={`/komik/genre/${genre}`}
        className="mt-8"
      />
    </>
  );
}

export default async function KomikGenrePage({ params, searchParams }: PageProps) {
  const { genre } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const title = genre.charAt(0).toUpperCase() + genre.slice(1).replace(/-/g, " ");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Tags className="text-primary h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Genre: {title}</h1>
          <p className="text-muted-foreground">Komik bergenre {title}</p>
        </div>
      </div>

      <Suspense fallback={<GridSkeleton count={12} />}>
        <GenreResults genre={genre} page={page} />
      </Suspense>
    </div>
  );
}

export const revalidate = 3600;
