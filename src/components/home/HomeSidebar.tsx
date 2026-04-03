"use client";

import { cn, getImageUrl, truncate } from "@/lib/utils";
import type { Anime, Komik } from "@/types";
import { Crown, Megaphone, Trophy, Star, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────

type RankingItem = (Komik | Anime) & {
  itemType: "komik" | "anime";
  points?: number;
  views?: number;
};

type RankingPeriod = "daily" | "weekly" | "monthly";

interface HomeSidebarProps {
  rankingItems?: RankingItem[];
  className?: string;
  /** Layout variant: vertical (default) or horizontal (for tablet) */
  variant?: "vertical" | "horizontal";
}

// ─── Top Readers Card ───────────────────────────────────────────────

function TopReadersCard() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
          <Crown className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Top Pembaca</h3>
          <p className="text-xs text-slate-400">Siapa Sepuh Disini?</p>
        </div>
      </div>
      <p className="mb-3 text-sm text-slate-300">Cek ranking pembaca teraktif!</p>
      <button
        type="button"
        className="w-full rounded-lg bg-amber-500/20 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
      >
        Lihat
      </button>
    </div>
  );
}

// ─── Announcements Card ─────────────────────────────────────────────

function AnnouncementsCard() {
  return (
    <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
          <Megaphone className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Pengumuman</h3>
          <p className="text-xs text-slate-400">Info Terbaru</p>
        </div>
      </div>
      <p className="mb-3 text-sm text-slate-300">Lihat semua pengumuman</p>
      <button
        type="button"
        className="w-full rounded-lg bg-blue-500/20 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
      >
        Cek
      </button>
    </div>
  );
}

// ─── Ranking Tabs ───────────────────────────────────────────────────

interface RankingTabsProps {
  activePeriod: RankingPeriod;
  onPeriodChange: (period: RankingPeriod) => void;
}

function RankingTabs({ activePeriod, onPeriodChange }: RankingTabsProps) {
  const tabs: { id: RankingPeriod; label: string }[] = [
    { id: "daily", label: "Harian" },
    { id: "weekly", label: "Mingguan" },
    { id: "monthly", label: "Bulanan" },
  ];

  return (
    <div className="flex rounded-lg bg-slate-800/50 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onPeriodChange(tab.id)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            activePeriod === tab.id
              ? "bg-primary text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Ranking Item Component ─────────────────────────────────────────

interface RankingItemCardProps {
  item: RankingItem;
  rank: number;
  isFirst?: boolean;
}

function RankingItemCard({ item, rank, isFirst = false }: RankingItemCardProps) {
  const [imageError, setImageError] = useState(false);

  const isKomik = item.itemType === "komik";
  const komik = item as Komik;
  const anime = item as Anime;

  const id = isKomik ? komik.manga_id : anime.urlId;
  const title = item.title || "Untitled";
  const thumbnail = item.thumbnail || komik.cover || anime.poster || "";
  const author = isKomik ? komik.author : anime.studio;
  const points = item.points || item.views || 0;
  const rating = item.rating || anime.score;

  const href = isKomik ? `/komik/${id}` : `/anime/${id}`;
  const imageUrl = imageError
    ? "https://placehold.co/96x128/1e293b/94a3b8?text=No"
    : getImageUrl(thumbnail);

  if (isFirst) {
    // Special styling for #1
    return (
      <Link
        href={href}
        className="group relative block rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 p-3 transition-all hover:border-amber-500/50"
      >
        <div className="flex gap-3">
          {/* Cover Image */}
          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="56px"
              unoptimized
              onError={() => setImageError(true)}
            />
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex items-center justify-center rounded bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">
                #{rank}
              </span>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 uppercase">
                Juara 1
              </span>
            </div>
            <h4 className="group-hover:text-primary line-clamp-2 text-sm font-medium text-white transition-colors">
              {truncate(title, 40)}
            </h4>
            {author && <p className="mt-0.5 text-xs text-slate-400">{truncate(author, 20)}</p>}
            <div className="mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <TrendingUp className="h-3 w-3" />
                {points} Poin
              </span>
              {rating && (
                <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  {rating}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Regular ranking item
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-800/50"
    >
      {/* Rank Number */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-700 text-xs font-bold text-slate-300">
        {rank}
      </span>

      {/* Cover Image */}
      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="40px"
          unoptimized
          onError={() => setImageError(true)}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h4 className="group-hover:text-primary line-clamp-1 text-sm font-medium text-white transition-colors">
          {truncate(title, 30)}
        </h4>
        <div className="mt-0.5 flex items-center gap-2">
          {author && <span className="text-xs text-slate-400">{truncate(author, 15)}</span>}
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400">{points} Poin</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Rankings Section ───────────────────────────────────────────────

interface RankingsSectionProps {
  items: RankingItem[];
}

function RankingsSection({ items }: RankingsSectionProps) {
  const [activePeriod, setActivePeriod] = useState<RankingPeriod>("weekly");

  // For now, we show the same items regardless of period
  // In a real app, you'd fetch different data based on period
  const displayItems = items.slice(0, 5);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="text-primary h-5 w-5" />
        <h2 className="text-lg font-bold text-white">Peringkat Mingguan</h2>
      </div>

      {/* Period Tabs */}
      <RankingTabs activePeriod={activePeriod} onPeriodChange={setActivePeriod} />

      {/* Rankings List */}
      <div className="mt-4 space-y-2">
        {displayItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">Belum ada data ranking</div>
        ) : (
          displayItems.map((item, index) => (
            <RankingItemCard
              key={`${item.itemType}-${index}`}
              item={item}
              rank={index + 1}
              isFirst={index === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Sidebar Component ─────────────────────────────────────────

export function HomeSidebar({
  rankingItems = [],
  className,
  variant = "vertical",
}: HomeSidebarProps) {
  if (variant === "horizontal") {
    // Horizontal layout for tablet (md breakpoint)
    return (
      <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", className)}>
        <TopReadersCard />
        <AnnouncementsCard />
        <RankingsSection items={rankingItems} />
      </div>
    );
  }

  // Default vertical layout for desktop sidebar
  return (
    <aside className={cn("space-y-4", className)}>
      <TopReadersCard />
      <AnnouncementsCard />
      <RankingsSection items={rankingItems} />
    </aside>
  );
}
