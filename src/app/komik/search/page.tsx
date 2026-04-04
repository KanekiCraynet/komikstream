import { Suspense } from "react";
import { searchKomik, advancedSearchKomik } from "@/lib/api";
import { Card, SearchBar } from "@/components/ui";
import { Pagination } from "@/components/ui/Pagination";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Book, SearchX } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    genre?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || "";
  return {
    title: query ? `Hasil pencarian: ${query}` : "Cari Komik",
    description: `Hasil pencarian komik untuk "${query}"`,
    robots: { index: false, follow: false },
  };
}

// ─── Filter Options ────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { label: "Semua", value: "all" },
  { label: "Manga", value: "manga" },
  { label: "Manhwa", value: "manhwa" },
  { label: "Manhua", value: "manhua" },
];

const STATUS_OPTIONS = [
  { label: "Semua", value: "all" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
];

const SORT_OPTIONS = [
  { label: "Relevansi", value: "relevance" },
  { label: "Terbaru", value: "latest" },
  { label: "Populer", value: "popular" },
  { label: "A-Z", value: "az" },
  { label: "Z-A", value: "za" },
];

// ─── Filter Bar ────────────────────────────────────────────────────

function FilterBar({
  query,
  type,
  status,
  sort,
}: {
  query: string;
  type: string;
  status: string;
  sort: string;
}) {
  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { q: query, type, status, sort, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all" && v !== "relevance") params.set(k, v);
    }
    const qs = params.toString();
    return `/komik/search${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="border-border bg-card/50 mb-6 space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">Tipe:</span>
        {TYPE_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={buildUrl({ type: opt.value })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              type === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">Status:</span>
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={buildUrl({ status: opt.value })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              status === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">Urutkan:</span>
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={buildUrl({ sort: opt.value })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sort === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Async Search Results (streams via Suspense) ────────────────────

async function KomikSearchResults({
  query,
  type,
  status,
  genre,
  sort,
  page,
}: {
  query: string;
  type: string;
  status: string;
  genre: string;
  sort: string;
  page: number;
}) {
  const hasAdvancedFilters =
    (type && type !== "all") ||
    (status && status !== "all") ||
    (genre && genre !== "all") ||
    (sort && sort !== "relevance");
  const hasQuery = query.length > 0;

  if (!hasQuery && !hasAdvancedFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Book className="text-muted-foreground/50 mb-4 h-16 w-16" />
        <p className="text-lg font-medium">Masukkan kata kunci pencarian</p>
        <p className="text-muted-foreground text-sm">
          Ketik judul komik atau gunakan filter di atas
        </p>
      </div>
    );
  }

  let results: Awaited<ReturnType<typeof searchKomik>> = [];
  let totalPages = 1;
  let error: string | null = null;

  try {
    if (hasAdvancedFilters || page > 1) {
      const advanced = await advancedSearchKomik({
        q: query || undefined,
        type: type !== "all" ? type : undefined,
        status: status !== "all" ? status : undefined,
        genre: genre !== "all" ? genre : undefined,
        sort: sort !== "relevance" ? sort : undefined,
        page,
      });
      results = advanced.items;
      totalPages = advanced.totalPages;
    } else {
      results = await searchKomik(query);
    }
  } catch {
    error = "Gagal mencari komik. Silakan coba lagi.";
  }

  // Build base URL for pagination
  const paginationParams = new URLSearchParams();
  if (query) paginationParams.set("q", query);
  if (type && type !== "all") paginationParams.set("type", type);
  if (status && status !== "all") paginationParams.set("status", status);
  if (genre && genre !== "all") paginationParams.set("genre", genre);
  if (sort && sort !== "relevance") paginationParams.set("sort", sort);
  const baseUrl = `/komik/search?${paginationParams.toString()}`;

  return (
    <>
      <div className="mb-6">
        <p className="text-muted-foreground text-sm">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : results.length > 0 ? (
            <>
              Ditemukan <span className="text-foreground font-medium">{results.length}</span> hasil
              {query && (
                <>
                  {" "}
                  untuk <span className="text-foreground font-medium">&quot;{query}&quot;</span>
                </>
              )}
            </>
          ) : (
            <>
              Tidak ada hasil
              {query && (
                <>
                  {" "}
                  untuk <span className="text-foreground font-medium">&quot;{query}&quot;</span>
                </>
              )}
            </>
          )}
        </p>
      </div>

      {results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((komik) => (
              <Card key={komik.manga_id} item={komik} type="komik" />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={baseUrl}
            className="mt-8"
          />
        </>
      ) : !error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchX className="text-muted-foreground/50 mb-4 h-16 w-16" />
          <p className="text-lg font-medium">Tidak ada hasil ditemukan</p>
          <p className="text-muted-foreground text-sm">Coba kata kunci atau filter yang berbeda</p>
        </div>
      ) : null}
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

export default async function KomikSearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const type = params.type || "all";
  const status = params.status || "all";
  const genre = params.genre || "all";
  const sort = params.sort || "relevance";
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const hasAnyParam = query || type !== "all" || status !== "all" || sort !== "relevance";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Static header renders instantly */}
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Book className="text-primary h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Cari Komik</h1>
            <p className="text-muted-foreground">Temukan komik favorit kamu</p>
          </div>
        </div>

        {/* Search */}
        <SearchBar
          placeholder="Cari judul komik..."
          searchPath="/komik/search"
          defaultValue={query}
          className="max-w-xl"
        />
      </div>

      {/* Advanced Filters */}
      <FilterBar query={query} type={type} status={status} sort={sort} />

      {/* Search results stream via Suspense */}
      <Suspense fallback={hasAnyParam ? <SearchResultsSkeleton /> : null}>
        <KomikSearchResults
          query={query}
          type={type}
          status={status}
          genre={genre}
          sort={sort}
          page={page}
        />
      </Suspense>
    </div>
  );
}
