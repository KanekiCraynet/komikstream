"use client";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { Book, Bookmark as BookmarkIcon, Film, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { SyncIndicator } from "@/components/ui/SyncIndicator";

export default function BookmarkPage() {
  const { bookmarks, removeBookmark } = useAppStore();
  const mounted = useMounted();
  const [filter, setFilter] = useState<"all" | "komik" | "anime">("all");

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-muted mb-8 h-8 w-48 rounded" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-muted aspect-[2/3] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredBookmarks = bookmarks.filter((b) => {
    if (filter === "all") return true;
    return b.type === filter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <BookmarkIcon className="text-primary h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Bookmark</h1>
            <p className="text-muted-foreground">Koleksi komik dan anime favorit kamu</p>
            <SyncIndicator />
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Filter bookmark">
          {(["all", "komik", "anime"] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {f === "all" ? "Semua" : f === "komik" ? "Komik" : "Anime"}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks Grid */}
      {filteredBookmarks.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="group relative">
              <Link
                href={
                  bookmark.type === "komik"
                    ? `/komik/${bookmark.itemId}`
                    : `/anime/${bookmark.itemId}`
                }
                className="bg-card border-border/50 hover:border-primary/50 flex flex-col overflow-hidden rounded-lg border transition-all"
              >
                <div className="bg-muted relative aspect-[2/3] overflow-hidden">
                  {bookmark.thumbnail ? (
                    <Image
                      src={bookmark.thumbnail}
                      alt={bookmark.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      {bookmark.type === "komik" ? (
                        <Book className="text-muted-foreground h-12 w-12" />
                      ) : (
                        <Film className="text-muted-foreground h-12 w-12" />
                      )}
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="bg-primary/90 text-primary-foreground rounded px-2 py-0.5 text-xs font-medium capitalize">
                      {bookmark.type}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-medium">{bookmark.title}</h3>
                </div>
              </Link>

              {/* Remove button */}
              <button
                onClick={() => removeBookmark(bookmark.type, bookmark.itemId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 absolute top-2 right-2 rounded-lg p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Hapus dari bookmark"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookmarkIcon className="text-muted-foreground/50 mb-4 h-16 w-16" />
          <p className="text-lg font-medium">Belum ada bookmark</p>
          <p className="text-muted-foreground mb-4 text-sm">
            Simpan komik atau anime favorit kamu di sini
          </p>
          <div className="flex gap-4">
            <Link
              href="/komik"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Book className="h-4 w-4" />
              Jelajahi Komik
            </Link>
            <Link
              href="/anime"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Film className="h-4 w-4" />
              Jelajahi Anime
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
