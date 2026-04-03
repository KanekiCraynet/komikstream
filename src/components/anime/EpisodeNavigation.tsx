"use client";

import type { AnimeEpisode } from "@/types";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Play } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface EpisodeNavigationProps {
  animeUrlId: string;
  episodes: AnimeEpisode[];
  currentEpisodeId: string;
  currentEpisode: AnimeEpisode | null;
  prevEpisode: AnimeEpisode | null;
  nextEpisode: AnimeEpisode | null;
  position: "top" | "bottom";
}

function getEpisodeUrl(animeUrlId: string, episode: AnimeEpisode): string {
  return `/watch/${animeUrlId}/${episode.url || episode.episodeId}`;
}

export default function EpisodeNavigation({
  animeUrlId,
  episodes,
  currentEpisodeId,
  currentEpisode,
  prevEpisode,
  nextEpisode,
  position,
}: EpisodeNavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeEpisodeRef = useRef<HTMLAnchorElement>(null);

  // Close dropdown when clicking/tapping outside
  useEffect(() => {
    function handleOutsideInteraction(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("touchstart", handleOutsideInteraction, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("touchstart", handleOutsideInteraction);
    };
  }, []);

  // Scroll active episode into view when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && activeEpisodeRef.current) {
      activeEpisodeRef.current.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [isDropdownOpen]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  if (position === "top") {
    return (
      <nav className="bg-background border-border border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-2 py-3">
            {/* Prev button */}
            {prevEpisode ? (
              <Link
                href={getEpisodeUrl(animeUrlId, prevEpisode)}
                className="text-primary flex items-center gap-1 text-sm hover:underline"
                title={prevEpisode.title}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Prev</span>
              </Link>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Prev</span>
              </span>
            )}

            {/* Episode dropdown */}
            <div className="relative flex-1 text-center" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="bg-secondary hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
              >
                <span className="max-w-[200px] truncate sm:max-w-none">
                  {currentEpisode?.title || `Episode ${currentEpisodeId}`}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown list */}
              {isDropdownOpen && (
                <div className="bg-popover border-border absolute left-1/2 z-[60] mt-2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-lg border shadow-xl">
                  <div className="border-border border-b px-4 py-2">
                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Daftar Episode ({episodes.length})
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto overscroll-contain">
                    {episodes.map((episode) => {
                      const epId = episode.url || episode.episodeId || "";
                      const isCurrent = epId === currentEpisodeId;
                      return (
                        <Link
                          key={epId}
                          ref={isCurrent ? activeEpisodeRef : undefined}
                          href={getEpisodeUrl(animeUrlId, episode)}
                          onClick={() => setIsDropdownOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                            isCurrent ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
                              isCurrent
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            <Play className="h-3 w-3 fill-current" />
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="truncate">{episode.title}</p>
                            {episode.date && (
                              <p className="text-muted-foreground text-xs">{episode.date}</p>
                            )}
                          </div>
                          {isCurrent && (
                            <span className="bg-primary/20 text-primary flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
                              Sekarang
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Next button */}
            {nextEpisode ? (
              <Link
                href={getEpisodeUrl(animeUrlId, nextEpisode)}
                className="text-primary flex items-center gap-1 text-sm hover:underline"
                title={nextEpisode.title}
              >
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Bottom navigation
  return (
    <nav className="bg-background border-border border-t">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {prevEpisode ? (
            <Link
              href={getEpisodeUrl(animeUrlId, prevEpisode)}
              className="bg-secondary hover:bg-secondary/80 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Episode Sebelumnya</span>
              <span className="sm:hidden">Prev</span>
            </Link>
          ) : (
            <div />
          )}

          {nextEpisode ? (
            <Link
              href={getEpisodeUrl(animeUrlId, nextEpisode)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <span className="hidden sm:inline">Episode Selanjutnya</span>
              <span className="sm:hidden">Next</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={`/anime/${animeUrlId}`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Kembali ke Detail
            </Link>
          )}
        </div>

        {/* Back to detail link (always shown) */}
        {nextEpisode && (
          <div className="border-border border-t pt-2 pb-3 text-center">
            <Link
              href={`/anime/${animeUrlId}`}
              className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline"
            >
              Kembali ke Detail Anime
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
