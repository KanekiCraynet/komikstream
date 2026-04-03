"use client";

import { cn, formatDate } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { Book, Clock, Film, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { SyncIndicator } from "@/components/ui/SyncIndicator";

export default function HistoryPage() {
  const { history, removeFromHistory, clearHistory } = useAppStore();
  const mounted = useMounted();
  const [filter, setFilter] = useState<"all" | "komik" | "anime">("all");

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-muted mb-8 h-8 w-48 rounded" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-muted h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredHistory = history.filter((h) => {
    if (filter === "all") return true;
    return h.type === filter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="text-primary h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">History</h1>
              <p className="text-muted-foreground">Riwayat baca dan tonton kamu</p>
              <SyncIndicator />
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Hapus semua history?")) {
                  clearHistory();
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Semua
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Filter history">
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

      {/* History List */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="group border-border bg-card hover:border-primary/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
            >
              {/* Thumbnail */}
              <Link
                href={item.type === "komik" ? `/komik/${item.itemId}` : `/anime/${item.itemId}`}
                className="bg-muted relative aspect-[2/3] w-16 flex-shrink-0 overflow-hidden rounded-lg"
              >
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {item.type === "komik" ? (
                      <Book className="text-muted-foreground h-6 w-6" />
                    ) : (
                      <Film className="text-muted-foreground h-6 w-6" />
                    )}
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <Link
                  href={item.type === "komik" ? `/komik/${item.itemId}` : `/anime/${item.itemId}`}
                  className="block"
                >
                  <h3 className="hover:text-primary truncate font-medium transition-colors">
                    {item.title}
                  </h3>
                </Link>
                <div className="mt-1 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium capitalize">
                    {item.type}
                  </span>
                  {item.progressTitle && (
                    <span className="text-muted-foreground truncate text-sm">
                      {item.progressTitle}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{formatDate(item.updatedAt)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={
                    item.type === "komik"
                      ? `/chapter/${item.progress}`
                      : `/watch/${item.itemId}/${item.progress}`
                  }
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Lanjutkan
                </Link>
                <button
                  onClick={() => removeFromHistory(item.type, item.itemId)}
                  className="bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground rounded-lg p-2 transition-colors"
                  aria-label="Hapus dari history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="text-muted-foreground/50 mb-4 h-16 w-16" />
          <p className="text-lg font-medium">Belum ada history</p>
          <p className="text-muted-foreground mb-4 text-sm">
            Riwayat baca dan tonton akan muncul di sini
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
