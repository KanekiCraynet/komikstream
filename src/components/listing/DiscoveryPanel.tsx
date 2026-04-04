"use client";

import { cn, formatNumber } from "@/lib/utils";
import type { Anime, Komik } from "@/types";
import { useKomikStats, useAnimeStats } from "@/hooks/useListingStats";
import {
  TrendingUp,
  Flame,
  BookOpen,
  Play,
  Palette,
  Library,
  Calendar,
  Star,
  Clock,
  Zap,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";

type Variant = "komik" | "anime";

interface DiscoveryPanelProps {
  variant: Variant;
  trendingItems?: (Komik | Anime)[];
  className?: string;
}

// Quick access links for komik
const KOMIK_QUICK_ACCESS = [
  { label: "Berwarna", href: "/komik/berwarna", icon: Palette },
  { label: "Pustaka", href: "/komik/pustaka", icon: Library },
  { label: "Jadwal Update", href: "/komik/jadwal", icon: Calendar },
];

// Quick access links for anime
const ANIME_QUICK_ACCESS = [
  { label: "Jadwal", href: "/anime/schedule", icon: Calendar },
  { label: "Sedang Tayang", href: "/anime?status=ongoing", icon: Play },
  { label: "Top Rating", href: "/anime?sort=rating", icon: Star },
];

export function DiscoveryPanel({ variant, trendingItems = [], className }: DiscoveryPanelProps) {
  const isKomik = variant === "komik";
  const quickAccess = isKomik ? KOMIK_QUICK_ACCESS : ANIME_QUICK_ACCESS;

  // Get stats from hooks
  const komikStats = useKomikStats();
  const animeStats = useAnimeStats();
  const stats = isKomik ? komikStats : animeStats;

  // Accent colors
  const accentText = isKomik ? "text-amber-400" : "text-blue-400";
  const accentBg = isKomik ? "bg-amber-500/10" : "bg-blue-500/10";
  const accentBorder = isKomik ? "border-amber-500/20" : "border-blue-500/20";
  const accentHover = isKomik ? "hover:bg-amber-500/20" : "hover:bg-blue-500/20";

  return (
    <aside className={cn("space-y-6", className)}>
      {/* Stats Section - Inline text format */}
      <div className={cn("rounded-xl p-4", accentBg, accentBorder, "border")}>
        <div className="mb-3 flex items-center gap-2">
          <Zap className={cn("h-4 w-4", accentText)} />
          <span className="text-sm font-semibold text-white">Statistik</span>
        </div>
        {stats.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Memuat stats...</span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-300">
            {stats.total ? (
              <>
                <span className={cn("font-bold", accentText)}>{formatNumber(stats.total)}</span>{" "}
                {isKomik ? "komik" : "anime"}
              </>
            ) : (
              <span className="text-slate-400">-</span>
            )}
            {stats.updatedToday > 0 && (
              <>
                {" "}
                <span className="text-slate-500">·</span>{" "}
                <span className={cn("font-bold", accentText)}>{stats.updatedToday}</span> update
                hari ini
              </>
            )}
            {stats.newThisWeek > 0 && (
              <>
                {" "}
                <span className="text-slate-500">·</span>{" "}
                <span className={cn("font-bold", accentText)}>{stats.newThisWeek}</span> baru minggu
                ini
              </>
            )}
          </p>
        )}
      </div>

      {/* Trending Section */}
      {trendingItems.length > 0 && (
        <div className="rounded-xl bg-slate-800/50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-semibold text-white">Trending</span>
            <span className="ml-auto text-[10px] tracking-wider text-slate-500 uppercase">
              Momentum
            </span>
          </div>
          <div className="space-y-3">
            {trendingItems.slice(0, 5).map((item, index) => {
              const isKomikItem = "manga_id" in item;
              const id = isKomikItem ? (item as Komik).manga_id : (item as Anime).urlId;
              const title = item.title || "Untitled";
              const thumbnail = item.thumbnail || (item as Komik).cover || (item as Anime).poster;
              const href = isKomik ? `/komik/${id}` : `/anime/${id}`;

              return (
                <Link
                  key={id}
                  href={href}
                  className="group -mx-2 flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-slate-700/50"
                >
                  {/* Rank number */}
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black"
                        : index === 1
                          ? "bg-gradient-to-br from-slate-300 to-slate-400 text-black"
                          : index === 2
                            ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                            : "bg-slate-700 text-slate-400"
                    )}
                  >
                    {index + 1}
                  </span>

                  {/* Thumbnail */}
                  <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded">
                    <Image
                      src={getImageUrl(thumbnail || "")}
                      alt={title}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                      sizes="32px"
                      unoptimized
                    />
                  </div>

                  {/* Title */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200 group-hover:text-white">
                      {title}
                    </p>
                    {item.genres && item.genres.length > 0 && (
                      <p className="truncate text-xs text-slate-500">
                        {item.genres.slice(0, 2).join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Trending indicator */}
                  <TrendingUp
                    className={cn(
                      "h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
                      index < 3 ? "text-orange-400" : "text-slate-500"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Access Section */}
      <div className="rounded-xl bg-slate-800/50 p-4">
        <div className="mb-4 flex items-center gap-2">
          {isKomik ? (
            <BookOpen className={cn("h-4 w-4", accentText)} />
          ) : (
            <Play className={cn("h-4 w-4", accentText)} />
          )}
          <span className="text-sm font-semibold text-white">Akses Cepat</span>
        </div>
        <div className="space-y-1">
          {quickAccess.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "-mx-1 flex items-center gap-3 rounded-lg p-2.5 text-sm text-slate-300 transition-all",
                  accentHover,
                  "hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4", accentText)} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Time indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
        <Clock className="h-3 w-3" />
        <span>Update setiap 5 menit</span>
      </div>
    </aside>
  );
}
