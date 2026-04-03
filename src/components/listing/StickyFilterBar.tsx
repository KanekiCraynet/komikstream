"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Clock,
  SortAsc,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Variant = "komik" | "anime";

interface FilterOption {
  label: string;
  value: string;
}

interface StickyFilterBarProps {
  variant: Variant;
  className?: string;
}

const KOMIK_TYPES: FilterOption[] = [
  { label: "Semua", value: "" },
  { label: "Manhwa", value: "manhwa" },
  { label: "Manhua", value: "manhua" },
  { label: "Manga", value: "manga" },
];

const ANIME_TYPES: FilterOption[] = [
  { label: "Semua", value: "" },
  { label: "TV", value: "tv" },
  { label: "Movie", value: "movie" },
  { label: "OVA", value: "ova" },
  { label: "ONA", value: "ona" },
];

const SORT_OPTIONS: FilterOption[] = [
  { label: "Terbaru", value: "latest" },
  { label: "Rating", value: "rating" },
  { label: "A-Z", value: "title" },
  { label: "Populer", value: "popular" },
];

const GENRES: FilterOption[] = [
  { label: "Action", value: "action" },
  { label: "Adventure", value: "adventure" },
  { label: "Comedy", value: "comedy" },
  { label: "Drama", value: "drama" },
  { label: "Fantasy", value: "fantasy" },
  { label: "Harem", value: "harem" },
  { label: "Horror", value: "horror" },
  { label: "Isekai", value: "isekai" },
  { label: "Mystery", value: "mystery" },
  { label: "Romance", value: "romance" },
  { label: "School", value: "school" },
  { label: "Sci-Fi", value: "sci-fi" },
  { label: "Slice of Life", value: "slice-of-life" },
  { label: "Sports", value: "sports" },
  { label: "Supernatural", value: "supernatural" },
];

export function StickyFilterBar({ variant, className }: StickyFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { scrollDirection, isAtTop } = useScrollDirection({ threshold: 20 });

  const [searchQuery, setSearchQuery] = useState("");
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  // Read current params
  const currentType = searchParams.get("type") || "";
  const currentSort = searchParams.get("sort") || "latest";
  const currentGenres = searchParams.get("genre")?.split(",").filter(Boolean) || [];

  const isKomik = variant === "komik";
  const types = isKomik ? KOMIK_TYPES : ANIME_TYPES;
  const basePath = isKomik ? "/komik" : "/anime";

  // Accent colors
  const accentBg = isKomik ? "bg-amber-500" : "bg-blue-500";
  const accentText = isKomik ? "text-amber-400" : "text-blue-400";
  const accentBorder = isKomik ? "border-amber-500/50" : "border-blue-500/50";

  // Build URL with params
  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Always reset to page 1 when filters change
    params.delete("page");

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${basePath}/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Toggle genre selection
  const toggleGenre = (genre: string) => {
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter((g) => g !== genre)
      : [...currentGenres, genre];

    const genreParam = newGenres.length > 0 ? newGenres.join(",") : null;
    router.push(buildUrl({ genre: genreParam }));
  };

  // Clear all filters
  const clearFilters = () => {
    router.push(basePath);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine visibility
  const shouldHide = scrollDirection === "down" && !isAtTop;
  const hasActiveFilters = currentType || currentGenres.length > 0 || currentSort !== "latest";

  return (
    <div
      className={cn(
        "sticky top-0 z-40 transition-transform duration-300",
        shouldHide ? "-translate-y-full" : "translate-y-0",
        className
      )}
    >
      {/* Glassmorphism bar */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-lg">
        <div className="mx-auto max-w-screen-2xl px-4 py-3">
          {/* Main row - all controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <form onSubmit={handleSearch} className="relative max-w-xs min-w-[180px] flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Cari ${isKomik ? "komik" : "anime"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-slate-800/60 py-2 pr-4 pl-10 text-sm text-white ring-1 ring-slate-700/50 transition-all outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-slate-600"
              />
            </form>

            {/* Divider */}
            <div className="hidden h-6 w-px bg-slate-700 sm:block" />

            {/* Type pills */}
            <div className="scrollbar-hide flex items-center gap-1.5 overflow-x-auto">
              {types.map((type) => (
                <Link
                  key={type.value}
                  href={buildUrl({ type: type.value || null })}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    currentType === type.value
                      ? cn(accentBg, "text-white shadow-lg")
                      : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white"
                  )}
                >
                  {type.label}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden h-6 w-px bg-slate-700 md:block" />

            {/* Sort dropdown-like pills */}
            <div className="hidden items-center gap-1.5 md:flex">
              {SORT_OPTIONS.map((option) => {
                const Icon =
                  option.value === "latest"
                    ? Sparkles
                    : option.value === "popular"
                      ? TrendingUp
                      : option.value === "rating"
                        ? Clock
                        : SortAsc;

                return (
                  <Link
                    key={option.value}
                    href={buildUrl({ sort: option.value === "latest" ? null : option.value })}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      currentSort === option.value
                        ? cn("bg-slate-700/80 ring-1", accentBorder, accentText)
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </Link>
                );
              })}
            </div>

            {/* Genre dropdown */}
            <div className="relative" ref={genreDropdownRef}>
              <button
                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  currentGenres.length > 0
                    ? cn("bg-slate-700/80 ring-1", accentBorder, accentText)
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
                )}
              >
                <SlidersHorizontal className="h-3 w-3" />
                Genre
                {currentGenres.length > 0 && (
                  <span
                    className={cn(
                      "ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                      accentBg,
                      "text-white"
                    )}
                  >
                    {currentGenres.length}
                  </span>
                )}
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform", showGenreDropdown && "rotate-180")}
                />
              </button>

              {/* Genre dropdown menu */}
              {showGenreDropdown && (
                <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl bg-slate-800/95 p-3 shadow-xl ring-1 ring-slate-700/50 backdrop-blur-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Pilih Genre</span>
                    {currentGenres.length > 0 && (
                      <button
                        onClick={() => router.push(buildUrl({ genre: null }))}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {GENRES.map((genre) => (
                      <button
                        key={genre.value}
                        onClick={() => toggleGenre(genre.value)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                          currentGenres.includes(genre.value)
                            ? cn(accentBg, "text-white")
                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                        )}
                      >
                        {genre.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-full bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:bg-red-500/20 hover:text-red-400"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          {/* Mobile sort row */}
          <div className="scrollbar-hide mt-3 flex items-center gap-1.5 overflow-x-auto md:hidden">
            {SORT_OPTIONS.map((option) => {
              const Icon =
                option.value === "latest"
                  ? Sparkles
                  : option.value === "popular"
                    ? TrendingUp
                    : option.value === "rating"
                      ? Clock
                      : SortAsc;

              return (
                <Link
                  key={option.value}
                  href={buildUrl({ sort: option.value === "latest" ? null : option.value })}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    currentSort === option.value
                      ? cn("bg-slate-700/80 ring-1", accentBorder, accentText)
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
