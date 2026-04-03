"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn, getImageUrl, truncate } from "@/lib/utils";
import type { Anime, Komik } from "@/types";
import { Star, BookOpen, Play, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type SpotlightItem = Komik | Anime;
type Variant = "komik" | "anime";

interface FeaturedSpotlightProps {
  items: SpotlightItem[];
  variant: Variant;
  autoRotateInterval?: number;
  className?: string;
}

function getItemProps(item: SpotlightItem, variant: Variant) {
  const isKomik = variant === "komik";
  const komik = item as Komik;
  const anime = item as Anime;

  return {
    id: isKomik ? komik.manga_id : anime.urlId,
    title: item.title || "Untitled",
    thumbnail: item.thumbnail || komik.cover || anime.poster || "",
    rating: item.rating || anime.score,
    type: isKomik ? komik.type : anime.type,
    status: item.status,
    description: komik.description || anime.synopsis || anime.description,
    genres: item.genres || [],
    href: isKomik ? `/komik/${komik.manga_id}` : `/anime/${anime.urlId}`,
  };
}

export function FeaturedSpotlight({
  items,
  variant,
  autoRotateInterval = 8000,
  className,
}: FeaturedSpotlightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const validItems = items.filter((item) => {
    const { id } = getItemProps(item, variant);
    return !!id;
  });

  const maxItems = Math.min(validItems.length, 5);
  const displayItems = validItems.slice(0, maxItems);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning]
  );

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % displayItems.length);
  }, [currentIndex, displayItems.length, goToSlide]);

  // Auto-rotate
  useEffect(() => {
    if (isPaused || displayItems.length <= 1) return;

    const interval = setInterval(nextSlide, autoRotateInterval);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, autoRotateInterval, displayItems.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - next
        goToSlide((currentIndex + 1) % displayItems.length);
      } else {
        // Swipe right - prev
        goToSlide((currentIndex - 1 + displayItems.length) % displayItems.length);
      }
    }
  };

  if (displayItems.length === 0) return null;

  const currentItem = displayItems[currentIndex];
  const props = getItemProps(currentItem, variant);
  const isKomik = variant === "komik";

  const gradientClass = isKomik
    ? "from-amber-950/95 via-slate-950/80 to-transparent"
    : "from-blue-950/95 via-slate-950/80 to-transparent";

  const accentColor = isKomik ? "text-amber-400" : "text-blue-400";
  const buttonBg = isKomik
    ? "bg-amber-500 hover:bg-amber-400 text-black"
    : "bg-blue-500 hover:bg-blue-400 text-white";

  return (
    <section
      className={cn(
        "relative h-[38vh] max-h-[480px] min-h-[320px] w-full overflow-hidden",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image with transition */}
      <div className="absolute inset-0">
        {displayItems.map((item, idx) => {
          const itemProps = getItemProps(item, variant);
          const imgUrl = imageError[idx]
            ? "https://placehold.co/1200x600/1a1a2e/ffffff?text=No+Image"
            : getImageUrl(itemProps.thumbnail);

          return (
            <div
              key={itemProps.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                idx === currentIndex ? "opacity-100" : "opacity-0"
              )}
            >
              {imageError[idx] ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <ImageOff className="h-16 w-16 text-slate-700" />
                </div>
              ) : (
                <Image
                  src={imgUrl}
                  alt={itemProps.title}
                  fill
                  className="object-cover object-center"
                  sizes="100vw"
                  priority={idx === 0}
                  unoptimized
                  onError={() => setImageError((prev) => ({ ...prev, [idx]: true }))}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-t", gradientClass)} />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-end">
        <div className="w-full px-4 pb-8 md:px-8 lg:max-w-2xl lg:px-12">
          {/* Badges */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {props.rating && (
              <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-yellow-400 backdrop-blur-sm">
                <Star className="h-3 w-3 fill-yellow-400" />
                {props.rating}
              </span>
            )}
            {props.type && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 capitalize backdrop-blur-sm">
                {props.type}
              </span>
            )}
            {props.status && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm",
                  props.status.toLowerCase().includes("ongoing")
                    ? "bg-green-500/20 text-green-400"
                    : "bg-blue-500/20 text-blue-400"
                )}
              >
                {props.status}
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            className={cn(
              "mb-2 text-2xl leading-tight font-bold text-white md:text-3xl lg:text-4xl",
              "transition-all duration-500",
              isTransitioning ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
            )}
          >
            {truncate(props.title, 60)}
          </h2>

          {/* Genres */}
          {props.genres.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {props.genres.slice(0, 4).map((genre) => (
                <span key={genre} className={cn("text-xs font-medium", accentColor)}>
                  {genre}
                  {props.genres.indexOf(genre) < Math.min(props.genres.length - 1, 3) && (
                    <span className="ml-1.5 text-slate-500">·</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {props.description && (
            <p
              className={cn(
                "mb-4 line-clamp-2 text-sm leading-relaxed text-slate-300 md:line-clamp-3",
                "transition-all delay-75 duration-500",
                isTransitioning ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
              )}
            >
              {truncate(props.description, 180)}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={props.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200",
                buttonBg
              )}
            >
              {isKomik ? (
                <BookOpen className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              {isKomik ? "Baca Sekarang" : "Tonton Sekarang"}
            </Link>
            <Link
              href={props.href}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
            >
              Detail
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      {displayItems.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {displayItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === currentIndex
                  ? cn("w-6", isKomik ? "bg-amber-400" : "bg-blue-400")
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
