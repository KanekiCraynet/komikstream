import { Suspense } from "react";
import { getAnimeByGenre } from "@/lib/api-client";
import { Card } from "@/components/ui";
import { Pagination } from "@/components/ui/Pagination";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Tags, SearchX } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
  return {
    title: `Anime Genre: ${title}`,
    description: `Daftar anime dengan genre ${title}`,
  };
}

async function GenreResults({ slug, page }: { slug: string; page: number }) {
  let result: Awaited<ReturnType<typeof getAnimeByGenre>>;
  try {
    result = await getAnimeByGenre(slug, page);
  } catch {
    result = { items: [], hasNextPage: false, totalPages: 0 };
  }
  const title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  if (result.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="text-muted-foreground/50 mb-4 h-16 w-16" />
        <p className="text-lg font-medium">Tidak ada anime ditemukan</p>
        <p className="text-muted-foreground text-sm">
          Genre &quot;{title}&quot; belum memiliki anime
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">
        Menampilkan anime genre <span className="text-foreground font-medium">{title}</span>
        {result.totalPages > 1 && (
          <>
            {" "}
            &mdash; Halaman {page} dari {result.totalPages}
          </>
        )}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {result.items.map((anime) => (
          <Card key={anime.urlId} item={anime} type="anime" />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={result.totalPages}
        baseUrl={`/anime/genre/${slug}`}
        className="mt-8"
      />
    </>
  );
}

export default async function AnimeGenreSlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Tags className="text-primary h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Genre: {title}</h1>
          <p className="text-muted-foreground">Anime bergenre {title}</p>
        </div>
      </div>

      <Suspense fallback={<GridSkeleton count={12} />}>
        <GenreResults slug={slug} page={page} />
      </Suspense>
    </div>
  );
}

export const revalidate = 3600; // 1 hour
