"use client";

import { cn, getImageUrl, truncate } from "@/lib/utils";
import type { Anime, Komik } from "@/types";
import { Bookmark, ChevronLeft, ChevronRight, Play, Star, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";

type FeaturedItem = (Komik | Anime) & { itemType: "komik" | "anime" };

interface HeroCarouselProps {
  items: FeaturedItem[];
  className?: string;
}

export function HeroCarousel({ items, className }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const maxItems = Math.min(items.length, 5); // Show max 5 items
  const featuredItems = items.slice(0, maxItems);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
  }, [featuredItems.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  }, [featuredItems.length]);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || featuredItems.length <= 1) return;

    const interval = setInterval(goToNext, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext, featuredItems.length]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  if (!featuredItems.length) return null;

  const currentItem = featuredItems[currentIndex];
  const isKomik = currentItem.itemType === "komik";
  const komik = currentItem as Komik;
  const anime = currentItem as Anime;

  const id = isKomik ? komik.manga_id : anime.urlId;
  const title = currentItem.title || "Untitled";
  const description = currentItem.description || anime.synopsis || "";
  const rating = currentItem.rating || anime.score || "N/A";
  const thumbnail = currentItem.cover || currentItem.thumbnail || anime.poster || "";
  const href = isKomik ? `/komik/${id}` : `/anime/${id}`;

  const imageUrl = imageError[currentIndex]
    ? "https://placehold.co/750x1000/1e293b/94a3b8?text=No+Image"
    : getImageUrl(thumbnail);

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#1e293b]",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background blur effect from cover image */}
      <div className="absolute inset-0 opacity-20">
        <Image src={imageUrl} alt="" fill className="object-cover blur-3xl" unoptimized />
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left Content */}
          <div className="order-2 flex flex-col justify-center lg:order-1">
            {/* Recommendation Badge */}
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold tracking-wide text-amber-400 uppercase">
                <span className="text-amber-300">RECOMMENDATION</span>
                <span className="text-white">#</span>
                <span className="text-lg font-bold text-white">{currentIndex + 1}</span>
              </span>

              {/* Rating Badge */}
              {rating && rating !== "N/A" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-semibold text-yellow-400">
                  <Star className="h-4 w-4 fill-yellow-400" />
                  {rating}
                  <span className="ml-0.5 text-xs text-yellow-300/80">Rating</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="mb-4 text-2xl leading-tight font-bold text-white md:text-3xl lg:text-4xl">
              {truncate(title, 80)}
            </h2>

            {/* Description */}
            <p className="mb-6 line-clamp-4 text-sm leading-relaxed text-slate-300 md:line-clamp-5 md:text-base">
              {truncate(description, 350)}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={href}
                className="bg-primary hover:bg-primary/90 shadow-primary/25 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
              >
                {isKomik ? (
                  <BookOpen className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                {isKomik ? "Baca Sekarang" : "Tonton Sekarang"}
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600/50 bg-slate-700/50 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-600/50"
              >
                <Bookmark className="h-4 w-4" />
                Simpan
              </button>
            </div>

            {/* Slide Indicators */}
            <div className="mt-8 flex items-center gap-2">
              {featuredItems.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === currentIndex
                      ? "bg-primary w-8"
                      : "w-1.5 bg-slate-500 hover:bg-slate-400"
                  )}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Cover Image */}
          <div className="relative order-1 lg:order-2">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl shadow-black/50 lg:max-w-md">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover transition-transform duration-500"
                sizes="(max-width: 768px) 80vw, 400px"
                priority
                unoptimized
                onError={() => setImageError((prev) => ({ ...prev, [currentIndex]: true }))}
              />

              {/* Type Badge */}
              {(isKomik ? komik.type : anime.type) && (
                <div className="absolute top-4 left-4">
                  <span className="bg-primary/90 rounded-lg px-3 py-1.5 text-xs font-semibold text-white uppercase">
                    {isKomik ? komik.type : anime.type}
                  </span>
                </div>
              )}

              {/* Status Badge */}
              {currentItem.status && (
                <div className="absolute top-4 right-4">
                  <span
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase",
                      currentItem.status.toLowerCase().includes("ongoing")
                        ? "bg-green-500/90 text-white"
                        : "bg-blue-500/90 text-white"
                    )}
                  >
                    {currentItem.status}
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {featuredItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrev}
                  className="absolute top-1/2 left-0 flex h-10 w-10 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800/80 text-white shadow-lg transition-all hover:scale-110 hover:bg-slate-700 lg:-translate-x-4"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  className="absolute top-1/2 right-0 flex h-10 w-10 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800/80 text-white shadow-lg transition-all hover:scale-110 hover:bg-slate-700 lg:translate-x-4"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
