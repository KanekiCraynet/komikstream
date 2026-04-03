"use client";

import { useRef, useState, useEffect } from "react";
import { cn, getImageUrl, truncate } from "@/lib/utils";
import type { Anime, Komik } from "@/types";
import { ChevronLeft, ChevronRight, Sparkles, Star, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Variant = "komik" | "anime";

interface RecommendationRowProps {
  title?: string;
  items: (Komik | Anime)[];
  variant: Variant;
  className?: string;
}

export function RecommendationRow({
  title = "Rekomendasi Untukmu",
  items,
  variant,
  className,
}: RecommendationRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const isKomik = variant === "komik";
  const accentText = isKomik ? "text-amber-400" : "text-blue-400";

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (items.length === 0) return null;

  return (
    <section className={cn("relative", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className={cn("h-5 w-5", accentText)} />
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>

        {/* Navigation buttons - desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all",
              canScrollLeft
                ? "bg-slate-700/80 text-white hover:bg-slate-600"
                : "cursor-not-allowed bg-slate-800/50 text-slate-600"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all",
              canScrollRight
                ? "bg-slate-700/80 text-white hover:bg-slate-600"
                : "cursor-not-allowed bg-slate-800/50 text-slate-600"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable container */}
      <div className="relative -mx-4 px-4">
        {/* Left fade gradient */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-12 bg-gradient-to-r from-slate-950 to-transparent" />
        )}

        {/* Right fade gradient */}
        {canScrollRight && (
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-12 bg-gradient-to-l from-slate-950 to-transparent" />
        )}

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => {
            const isKomikItem = "manga_id" in item;
            const id = isKomikItem ? (item as Komik).manga_id : (item as Anime).urlId;
            const itemTitle = item.title || "Untitled";
            const thumbnail =
              item.thumbnail || (item as Komik).cover || (item as Anime).poster || "";
            const rating = item.rating || (item as Anime).score;
            const type = item.type;
            const href = isKomik ? `/komik/${id}` : `/anime/${id}`;
            const hasError = imageErrors[id];

            return (
              <Link key={id} href={href} className="group w-[140px] flex-shrink-0 sm:w-[150px]">
                {/* Card */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-800/50 ring-1 ring-slate-700/50 transition-all duration-300 group-hover:shadow-lg group-hover:ring-2 group-hover:shadow-black/20 group-hover:ring-slate-600">
                  {/* Image */}
                  {hasError ? (
                    <div className="flex h-full items-center justify-center bg-slate-800">
                      <ImageOff className="h-8 w-8 text-slate-600" />
                    </div>
                  ) : (
                    <Image
                      src={getImageUrl(thumbnail)}
                      alt={itemTitle}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="150px"
                      unoptimized
                      onError={() => setImageErrors((prev) => ({ ...prev, [id]: true }))}
                    />
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

                  {/* Badges */}
                  <div className="absolute top-2 right-2 left-2 flex items-start justify-between">
                    {rating && (
                      <span className="flex items-center gap-0.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400 backdrop-blur-sm">
                        <Star className="h-2.5 w-2.5 fill-yellow-400" />
                        {rating}
                      </span>
                    )}
                    {type && (
                      <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/80 capitalize backdrop-blur-sm">
                        {type}
                      </span>
                    )}
                  </div>

                  {/* Title at bottom */}
                  <div className="absolute right-0 bottom-0 left-0 p-2.5">
                    <h3 className="line-clamp-2 text-sm leading-tight font-medium text-white group-hover:text-slate-100">
                      {truncate(itemTitle, 40)}
                    </h3>
                    {item.genres && item.genres.length > 0 && (
                      <p className="mt-1 truncate text-[10px] text-slate-400">
                        {item.genres.slice(0, 2).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
