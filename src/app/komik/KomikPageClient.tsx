"use client";

import { Card, SearchBar, Pagination } from "@/components/ui";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { useKomikLatest, useKomikPopular, useKomikRecommended } from "@/hooks/useKomik";
import type { KomikType } from "@/hooks/useKomik";
import { Book, TrendingUp, Sparkles, Filter, Palette, Library } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ─── Static Shell (renders immediately) ─────────────────────────────

function KomikHeader({ type, sort }: { type?: string; sort: string }) {
  const types = [
    { label: "Semua", value: undefined, href: "/komik" },
    { label: "Manhwa", value: "manhwa", href: "/komik?type=manhwa" },
    { label: "Manhua", value: "manhua", href: "/komik?type=manhua" },
    { label: "Manga", value: "manga", href: "/komik?type=manga" },
  ];

  return (
    <div className="mb-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Book className="text-primary h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Komik</h1>
          <p className="text-muted-foreground">Baca koleksi manhwa, manhua, dan manga terlengkap</p>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        placeholder="Cari judul komik..."
        searchPath="/komik/search"
        className="max-w-xl"
      />

      {/* Type Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="text-muted-foreground h-4 w-4" />
        {types.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              type === t.value || (!type && t.value === undefined)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/komik/berwarna"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        >
          <Palette className="h-4 w-4" />
          Berwarna
        </Link>
        <Link
          href="/komik/pustaka"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        >
          <Library className="h-4 w-4" />
          Pustaka
        </Link>
      </div>

      {/* Sort Tabs */}
      {!type && (
        <div className="border-border flex items-center gap-2 border-b pb-2">
          <Link
            href="/komik"
            className={`-mb-[9px] border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              sort === "latest"
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Terbaru
            </span>
          </Link>
          <Link
            href="/komik?sort=popular"
            className={`-mb-[9px] border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              sort === "popular"
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Populer
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Client Data Grid (fetches via TanStack Query) ──────────────────

function KomikMainGrid({ type, sort, page }: { type?: KomikType; sort: string; page: number }) {
  // Only fetch what's needed based on current filters
  const { data: latestKomik, isLoading: loadingLatest } = useKomikLatest("mirror");
  const { data: popularKomik, isLoading: loadingPopular } = useKomikPopular(page);
  const { data: recommendedKomik, isLoading: loadingRecommended } = useKomikRecommended(
    type || "manhwa"
  );

  const isLoading = type ? loadingRecommended : sort === "popular" ? loadingPopular : loadingLatest;

  if (isLoading) {
    return <KomikGridSkeleton />;
  }

  // Determine display data based on filters
  let displayKomik = sort === "popular" ? (popularKomik ?? []) : (latestKomik ?? []);

  if (type) {
    displayKomik = recommendedKomik ?? [];
  }

  // Build current URL for pagination
  const buildPaginationUrl = () => {
    const urlParams = new URLSearchParams();
    if (type) urlParams.set("type", type);
    if (sort !== "latest") urlParams.set("sort", sort);
    return `/komik?${urlParams.toString()}`;
  };

  const estimatedTotalPages = sort === "popular" ? 10 : 1;

  return (
    <>
      {/* Main Grid */}
      <section className="mb-12">
        <div className="mb-6 flex items-center gap-2">
          {sort === "popular" ? (
            <TrendingUp className="text-primary h-5 w-5" />
          ) : (
            <Sparkles className="text-primary h-5 w-5" />
          )}
          <h2 className="text-xl font-bold">
            {type
              ? `Rekomendasi ${type.charAt(0).toUpperCase() + type.slice(1)}`
              : sort === "popular"
                ? "Komik Populer"
                : "Komik Terbaru"}
          </h2>
          {sort === "popular" && (
            <span className="text-muted-foreground ml-2 text-sm">Halaman {page}</span>
          )}
        </div>

        {displayKomik.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {displayKomik.map((komik, index) => (
                <Card key={komik.manga_id} item={komik} type="komik" index={index} />
              ))}
            </div>

            {/* Pagination for popular sort */}
            {sort === "popular" && (
              <Pagination
                currentPage={page}
                totalPages={estimatedTotalPages}
                baseUrl={buildPaginationUrl()}
                className="mt-8"
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Book className="text-muted-foreground/50 mb-4 h-16 w-16" />
            <p className="text-lg font-medium">Tidak ada komik ditemukan</p>
            <p className="text-muted-foreground text-sm">Coba filter atau pencarian yang berbeda</p>
          </div>
        )}
      </section>

      {/* Popular Section (if not already showing popular) */}
      {sort !== "popular" && !type && (popularKomik ?? []).length > 0 && (
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary h-5 w-5" />
              <h2 className="text-xl font-bold">Komik Populer</h2>
            </div>
            <Link href="/komik?sort=popular" className="text-primary text-sm hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {(popularKomik ?? []).slice(0, 6).map((komik, index) => (
              <Card key={komik.manga_id} item={komik} type="komik" index={index} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────

function KomikGridSkeleton() {
  return (
    <div className="space-y-8">
      <section className="mb-12">
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-muted h-5 w-5 animate-pulse rounded" />
          <div className="bg-muted h-7 w-40 animate-pulse rounded" />
        </div>
        <GridSkeleton count={12} />
      </section>
    </div>
  );
}

// ─── Page Component ─────────────────────────────────────────────────
// This is now a client component. The page shell with metadata is
// handled by the layout; this component reads searchParams client-side
// via useSearchParams() and fetches data via TanStack Query hooks.

export default function KomikPageClient() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as KomikType | null;
  const sort = searchParams.get("sort") || "latest";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Static header renders instantly */}
      <KomikHeader type={type ?? undefined} sort={sort} />

      {/* Data grid fetches client-side via TanStack Query hooks */}
      <KomikMainGrid type={type ?? undefined} sort={sort} page={page} />
    </div>
  );
}
