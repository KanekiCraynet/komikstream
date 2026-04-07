"use client";

import { cn, getImageUrl, truncate } from "@/lib/utils";
import type { Anime, Komik, KomikChapter, AnimeEpisode } from "@/types";
import { BookOpen, Play, Star, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface CardProps {
  item: Komik | Anime;
  type: "komik" | "anime";
  className?: string;
  index?: number;
  priority?: boolean; // Mark above-fold images as priority for LCP
  variant?: "default" | "compact" | "detailed"; // Card variants
  showChapters?: boolean; // Show latest chapters/episodes with dates
}

// Helper to format date strings
function formatDate(dateStr?: string): string {
  if (!dateStr) return "";

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If not a valid date, return as-is (might already be formatted like "30 Jan 2026")
      return dateStr;
    }
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function Card({
  item,
  type,
  className,
  index = 0,
  priority = false,
  variant = "default",
  showChapters = true,
}: CardProps) {
  const [imageError, setImageError] = useState(false);

  const isKomik = type === "komik";
  const komik = item as Komik;
  const anime = item as Anime;

  const id = isKomik ? komik.manga_id : anime.urlId;

  // Skip if no valid ID
  if (!id) return null;

  const title = item.title || "Untitled";
  const thumbnail = item.thumbnail || (item as Komik).cover || (item as Anime).poster || "";
  const rating = item.rating || (item as Anime).score;
  const itemType = isKomik ? komik.type : anime.type;
  const status = item.status;
  const author = isKomik ? komik.author : anime.studio;

  // Get latest 2 chapters/episodes
  const chapters: (KomikChapter | AnimeEpisode)[] = isKomik
    ? (komik.chapters || []).slice(0, 2)
    : (anime.episodes || anime.chapter || []).slice(0, 2);

  const href = isKomik ? `/komik/${id}` : `/anime/${id}`;
  const imageUrl = imageError
    ? "https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image"
    : getImageUrl(thumbnail);

  // Stagger delay via CSS custom property (capped at 0.5s)
  const animDelay = `${Math.min(index * 0.05, 0.5)}s`;

  // Compact variant for sidebar/list views
  if (variant === "compact") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-800/50",
          className
        )}
      >
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg">
          {imageError ? (
            <div className="bg-muted absolute inset-0 flex items-center justify-center">
              <ImageOff className="text-muted-foreground h-4 w-4" />
            </div>
          ) : (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="48px"
              unoptimized
              onError={() => setImageError(true)}
            />
          )}
          {rating && (
            <div className="absolute top-0.5 right-0.5">
              <span className="flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-yellow-400">
                <Star className="h-2.5 w-2.5 fill-yellow-400" />
                {rating}
              </span>
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="group-hover:text-primary line-clamp-1 text-sm font-medium text-white transition-colors">
            {truncate(title, 30)}
          </h3>
          {status && (
            <span
              className={cn(
                "mt-0.5 text-[10px] font-medium uppercase",
                status.toLowerCase().includes("ongoing") ? "text-green-400" : "text-blue-400"
              )}
            >
              {status}
            </span>
          )}
          {chapters.length > 0 && showChapters && (
            <div className="mt-1 space-y-0.5">
              {chapters.map((ch, idx) => {
                const chapterNum = isKomik
                  ? (ch as KomikChapter).chapter
                  : (ch as AnimeEpisode).episode;
                const date = ch.date;
                return (
                  <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>
                      {isKomik ? "Ch." : "Ep."} {chapterNum}
                    </span>
                    {date && <span>{formatDate(date)}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Default/Detailed card variant
  return (
    <div
      className="animate-fade-in transition-transform duration-200 hover:-translate-y-1"
      style={{ animationDelay: animDelay, animationFillMode: "both" }}
    >
      <Link
        href={href}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl",
          "bg-card/80 border-border/50 border backdrop-blur-sm transition-all duration-300",
          "hover:border-primary/50 hover:shadow-primary/20 hover:shadow-2xl",
          className
        )}
      >
        {/* Thumbnail */}
        <div className="bg-muted relative aspect-[2/3] overflow-hidden">
          {imageError ? (
            <div className="bg-muted absolute inset-0 flex items-center justify-center">
              <ImageOff className="text-muted-foreground h-8 w-8" />
            </div>
          ) : (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              priority={priority}
              unoptimized
              onError={() => setImageError(true)}
            />
          )}

          {/* Overlay on hover/active (active for touch devices) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100" />

          {/* Play/Read icon on hover/active */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 group-active:scale-110 group-active:opacity-100">
            <div className="bg-primary text-primary-foreground shadow-primary/50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl">
              {isKomik ? (
                <BookOpen className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
            </div>
          </div>

          {/* Type badge */}
          {itemType && (
            <div className="absolute top-2 left-2">
              <span className="bg-primary/90 text-primary-foreground rounded px-2 py-0.5 text-xs font-medium capitalize">
                {itemType}
              </span>
            </div>
          )}

          {/* Rating badge */}
          {rating && (
            <div className="absolute top-2 right-2">
              <span className="flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-yellow-400">
                <Star className="h-3 w-3 fill-yellow-400" />
                {rating}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1 p-3">
          <h3 className="group-hover:text-primary line-clamp-2 text-sm leading-tight font-medium transition-colors">
            {truncate(title, 50)}
          </h3>

          {/* Author/Status row */}
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {author && <span className="line-clamp-1">{truncate(author, 15)}</span>}
            {author && status && <span className="text-border">•</span>}
            {status && (
              <span
                className={cn(
                  "font-medium",
                  status.toLowerCase().includes("ongoing") ? "text-green-500" : "text-blue-500"
                )}
              >
                {status}
              </span>
            )}
          </div>

          {/* Latest chapters/episodes with dates */}
          {showChapters && chapters.length > 0 && (
            <div className="border-border/50 mt-2 space-y-1 border-t pt-2">
              {chapters.map((ch, idx) => {
                const chapterNum = isKomik
                  ? (ch as KomikChapter).chapter
                  : (ch as AnimeEpisode).episode;
                const date = ch.date;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-primary cursor-pointer font-medium hover:underline">
                      {isKomik ? "Ch." : "Ep."} {chapterNum}
                    </span>
                    {date && <span className="text-muted-foreground">{formatDate(date)}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback if no chapters array but has latestChapter */}
          {(!showChapters || chapters.length === 0) && komik.latestChapter && (
            <p className="text-muted-foreground text-xs">Ch. {komik.latestChapter}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
