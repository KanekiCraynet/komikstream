"use client";

import { cn, getImageUrl, truncate } from "@/lib/utils";
import type { Anime, Komik } from "@/types";
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
}

export function Card({ item, type, className, index = 0, priority = false }: CardProps) {
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

  const href = isKomik ? `/komik/${id}` : `/anime/${id}`;
  const imageUrl = imageError
    ? "https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image"
    : getImageUrl(thumbnail);

  // Stagger delay via CSS custom property (capped at 0.5s)
  const animDelay = `${Math.min(index * 0.05, 0.5)}s`;

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
          {komik.latestChapter && (
            <p className="text-muted-foreground text-xs">Ch. {komik.latestChapter}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
