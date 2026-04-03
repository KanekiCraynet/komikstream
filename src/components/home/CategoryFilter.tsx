"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Category {
  id: string;
  label: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  className?: string;
}

// Default categories for Komik/Anime
export const defaultCategories: Category[] = [
  { id: "all", label: "Semua" },
  { id: "romance", label: "Romance" },
  { id: "harem", label: "Harem" },
  { id: "isekai", label: "Isekai" },
  { id: "fantasy", label: "Fantasy" },
  { id: "action", label: "Action" },
  { id: "adventure", label: "Adventure" },
  { id: "comedy", label: "Comedy" },
  { id: "drama", label: "Drama" },
  { id: "school", label: "School" },
  { id: "slice-of-life", label: "Slice of Life" },
  { id: "mystery", label: "Mystery" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "supernatural", label: "Supernatural" },
  { id: "horror", label: "Horror" },
];

export function CategoryFilter({
  categories = defaultCategories,
  selectedCategory,
  onSelectCategory,
  className,
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute top-1/2 left-0 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800/90 text-white shadow-lg transition-all hover:scale-110 hover:bg-slate-700"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Category pills container */}
      <div
        ref={scrollRef}
        className={cn(
          "scrollbar-hide flex items-center gap-2 overflow-x-auto scroll-smooth",
          canScrollLeft && "pl-10",
          canScrollRight && "pr-10"
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
              selectedCategory === category.id
                ? "bg-primary shadow-primary/25 text-white shadow-lg"
                : "border border-slate-600/50 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute top-1/2 right-0 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800/90 text-white shadow-lg transition-all hover:scale-110 hover:bg-slate-700"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
