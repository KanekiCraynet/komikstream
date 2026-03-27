import { Suspense } from "react";
import { searchAnime } from "@/lib/api-client";
import { Card, SearchBar } from "@/components/ui";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Film, SearchX } from "lucide-react";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || "";
  return {
    title: query ? `Hasil pencarian: ${query}` : "Cari Anime",
    description: `Hasil pencarian anime untuk "${query}"`,
    robots: { index: false, follow: false },
  };
}

// ─── Async Search Results (streams via Suspense) ────────────────────

async function AnimeSearchResults({ query }: { query: string }) {
  let results: Awaited<ReturnType<typeof searchAnime>> = [];
  let error: string | null = null;

  if (query) {
    try {
      results = await searchAnime(query);
    } catch {
      error = "Gagal mencari anime. Silakan coba lagi.";
    }
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Film className="text-muted-foreground/50 mb-4 h-16 w-16" />
        <p className="text-lg font-medium">Masukkan kata kunci pencarian</p>
        <p className="text-muted-foreground text-sm">Ketik judul anime yang ingin kamu cari</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-muted-foreground text-sm">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : results.length > 0 ? (
            <>
              Ditemukan <span className="text-foreground font-medium">{results.length}</span> hasil
              untuk <span className="text-foreground font-medium">&quot;{query}&quot;</span>
            </>
          ) : (
            <>
              Tidak ada hasil untuk{" "}
              <span className="text-foreground font-medium">&quot;{query}&quot;</span>
            </>
          )}
        </p>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((anime) => (
            <Card key={anime.urlId} item={anime} type="anime" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchX className="text-muted-foreground/50 mb-4 h-16 w-16" />
          <p className="text-lg font-medium">Tidak ada hasil ditemukan</p>
          <p className="text-muted-foreground text-sm">Coba kata kunci yang berbeda</p>
        </div>
      )}
    </>
  );
}

// ─── Loading Skeleton for search results ────────────────────────────

function SearchResultsSkeleton() {
  return (
    <div>
      <div className="bg-muted mb-6 h-5 w-48 animate-pulse rounded" />
      <GridSkeleton count={12} />
    </div>
  );
}

// ─── Page Component ─────────────────────────────────────────────────

export default async function AnimeSearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Static header renders instantly */}
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Film className="text-primary h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Cari Anime</h1>
            <p className="text-muted-foreground">Temukan anime favorit kamu</p>
          </div>
        </div>

        {/* Search */}
        <SearchBar
          placeholder="Cari judul anime..."
          searchPath="/anime/search"
          defaultValue={query}
          className="max-w-xl"
        />
      </div>

      {/* Search results stream via Suspense */}
      <Suspense fallback={query ? <SearchResultsSkeleton /> : null}>
        <AnimeSearchResults query={query} />
      </Suspense>
    </div>
  );
}
