"use client";

import { Card } from "@/components/ui";
import { SectionSkeleton } from "@/components/ui/Skeleton";
import { useKomikLatest, useKomikPopular } from "@/hooks/useKomik";
import { useAnimeLatest, useAnimeRecommended } from "@/hooks/useAnime";
import {
  ArrowRight,
  Book,
  Film,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Play,
} from "lucide-react";
import Link from "next/link";
import { CategoryFilter, defaultCategories } from "./CategoryFilter";
import { useState } from "react";
import type { Komik, Anime } from "@/types";

// ─── Shared Section Header ─────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  href?: string;
  linkText?: string;
}

function SectionHeader({ title, icon, href, linkText = "List Semua" }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-foreground text-lg font-bold md:text-xl">{title}</h3>
      </div>
      {href && (
        <Link
          href={href}
          className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        >
          {linkText}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ─── Shared Section Wrapper ─────────────────────────────────────────

interface SectionWrapperProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  linkText: string;
  children: React.ReactNode;
}

function SectionWrapper({
  title,
  description,
  icon,
  href,
  linkText,
  children,
}: SectionWrapperProps) {
  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </div>
          <Link
            href={href}
            className="text-primary group flex items-center gap-1 text-sm hover:underline"
          >
            {linkText}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}

// ─── Empty State ────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  href: string;
  linkText: string;
}

function EmptyState({ icon, message, href, linkText }: EmptyStateProps) {
  return (
    <div className="border-border/50 bg-card/30 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
      <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-full">
        {icon}
      </div>
      <p className="text-muted-foreground mb-1 text-sm font-medium">Konten belum tersedia</p>
      <p className="text-muted-foreground/70 mb-5 max-w-xs text-xs">{message}</p>
      <Link
        href={href}
        className="text-primary group flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        {linkText}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

// ─── Update Terbaru Section (Latest Updates with Filter) ────────────

interface UpdateTerbaruSectionProps {
  komikData?: Komik[];
  animeData?: Anime[];
  isLoading?: boolean;
}

export function UpdateTerbaruSection({
  komikData,
  animeData,
  isLoading,
}: UpdateTerbaruSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Combine komik and anime data for display
  const allItems: (Komik | Anime)[] = [
    ...(komikData || []).map((k) => ({ ...k, _type: "komik" as const })),
    ...(animeData || []).map((a) => ({ ...a, _type: "anime" as const })),
  ];

  // Filter by category if not "all" (in real app, you'd filter by genre)
  const filteredItems =
    selectedCategory === "all"
      ? allItems
      : allItems.filter((item) => {
          const genres = (item as Komik).genres || (item as Anime).genres || [];
          return genres.some((g) => g.toLowerCase().includes(selectedCategory.toLowerCase()));
        });

  if (isLoading) {
    return <SectionSkeleton title="Update Terbaru" />;
  }

  return (
    <section className="py-6">
      {/* Section Header */}
      <SectionHeader
        title="Update Terbaru"
        icon={<Clock className="text-primary h-5 w-5" />}
        href="/komik"
        linkText="List Semua Komik"
      />

      {/* Category Filter */}
      <div className="mb-6">
        <CategoryFilter
          categories={defaultCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Content Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Book className="text-muted-foreground h-6 w-6" />}
          message="Konten terbaru sedang dimuat atau belum tersedia saat ini."
          href="/komik"
          linkText="Jelajahi Komik"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
          {filteredItems.slice(0, 10).map((item, index) => {
            const isKomik = "_type" in item ? item._type === "komik" : "manga_id" in item;
            return (
              <Card
                key={isKomik ? (item as Komik).manga_id : (item as Anime).urlId}
                item={item}
                type={isKomik ? "komik" : "anime"}
                index={index}
                priority={index < 4}
                showChapters={true}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Ongoing Section (Horizontal Scroll) ────────────────────────────

interface OngoingSectionProps {
  title: string;
  items: (Komik | Anime)[];
  type: "komik" | "anime";
  href: string;
  isLoading?: boolean;
}

export function OngoingSection({ title, items, type, href, isLoading }: OngoingSectionProps) {
  const icon =
    type === "komik" ? (
      <Book className="text-primary h-5 w-5" />
    ) : (
      <Play className="text-primary h-5 w-5" />
    );

  // Show all items (API may not always include status field)
  // Prioritize items with "ongoing" status if available, otherwise show all
  const displayItems = items.filter((item) => item.status?.toLowerCase().includes("ongoing"));
  const finalItems = displayItems.length > 0 ? displayItems : items;

  if (isLoading) {
    return (
      <section className="py-6">
        <SectionHeader title={title} icon={icon} href={href} />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-muted h-48 w-32 shrink-0 animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (finalItems.length === 0) return null;

  return (
    <section className="py-6">
      <SectionHeader title={title} icon={icon} href={href} />

      <div
        className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {finalItems.slice(0, 10).map((item, index) => (
          <div
            key={type === "komik" ? (item as Komik).manga_id : (item as Anime).urlId}
            className="w-36 shrink-0"
          >
            <Card item={item} type={type} index={index} variant="compact" showChapters={true} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Completed Section (Tamat) ──────────────────────────────────────

interface CompletedSectionProps {
  title: string;
  items: (Komik | Anime)[];
  type: "komik" | "anime";
  href: string;
  isLoading?: boolean;
}

export function CompletedSection({ title, items, type, href, isLoading }: CompletedSectionProps) {
  const icon = <CheckCircle2 className="h-5 w-5 text-blue-500" />;

  // Filter for completed items
  const completedItems = items.filter(
    (item) =>
      item.status?.toLowerCase().includes("completed") ||
      item.status?.toLowerCase().includes("tamat") ||
      item.status?.toLowerCase().includes("end")
  );

  // If no completed items found by status, fallback to showing all items
  // (API may not always return status field)
  const finalItems = completedItems.length > 0 ? completedItems : items;

  if (isLoading) {
    return (
      <section className="py-6">
        <SectionHeader title={title} icon={icon} href={href} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-muted h-64 animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (finalItems.length === 0) return null;

  return (
    <section className="py-6">
      <SectionHeader title={title} icon={icon} href={`${href}?status=completed`} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {finalItems.slice(0, 6).map((item, index) => (
          <Card
            key={type === "komik" ? (item as Komik).manga_id : (item as Anime).urlId}
            item={item}
            type={type}
            index={index}
            showChapters={true}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Client Sections (Original - kept for backward compatibility) ───

export function KomikLatestSection() {
  const { data: komikLatest, isLoading } = useKomikLatest();

  if (isLoading) return <SectionSkeleton title="Komik Terbaru" />;

  return (
    <SectionWrapper
      title="Komik Terbaru"
      description="Update chapter terbaru hari ini"
      icon={<Sparkles className="text-primary h-5 w-5" />}
      href="/komik"
      linkText="Lihat Semua"
    >
      {!komikLatest || komikLatest.length === 0 ? (
        <EmptyState
          icon={<Book className="text-muted-foreground h-6 w-6" />}
          message="Komik terbaru sedang dimuat atau belum tersedia saat ini."
          href="/komik"
          linkText="Jelajahi Komik"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {komikLatest.slice(0, 12).map((komik, index) => (
            <Card
              key={komik.manga_id}
              item={komik}
              type="komik"
              index={index}
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </SectionWrapper>
  );
}

export function KomikPopularSection() {
  const { data: komikPopular, isLoading } = useKomikPopular();

  if (isLoading) return <SectionSkeleton title="Komik Populer" />;

  return (
    <SectionWrapper
      title="Komik Populer"
      description="Komik paling banyak dibaca"
      icon={<TrendingUp className="text-primary h-5 w-5" />}
      href="/komik?sort=popular"
      linkText="Lihat Semua"
    >
      {!komikPopular || komikPopular.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="text-muted-foreground h-6 w-6" />}
          message="Data komik populer sedang dimuat atau belum tersedia saat ini."
          href="/komik"
          linkText="Jelajahi Komik"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {komikPopular.slice(0, 12).map((komik, index) => (
            <Card key={komik.manga_id} item={komik} type="komik" index={index} />
          ))}
        </div>
      )}
    </SectionWrapper>
  );
}

export function AnimeLatestSection() {
  const { data: animeLatest, isLoading } = useAnimeLatest();

  if (isLoading) return <SectionSkeleton title="Anime Terbaru" />;

  return (
    <SectionWrapper
      title="Anime Terbaru"
      description="Episode terbaru yang baru rilis"
      icon={<Film className="text-primary h-5 w-5" />}
      href="/anime"
      linkText="Lihat Semua"
    >
      {!animeLatest || animeLatest.length === 0 ? (
        <EmptyState
          icon={<Film className="text-muted-foreground h-6 w-6" />}
          message="Anime terbaru sedang dimuat atau belum tersedia saat ini."
          href="/anime"
          linkText="Jelajahi Anime"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {animeLatest.slice(0, 12).map((anime, index) => (
            <Card key={anime.urlId} item={anime} type="anime" index={index} />
          ))}
        </div>
      )}
    </SectionWrapper>
  );
}

export function AnimeRecommendedSection() {
  const { data: animeRecommended, isLoading } = useAnimeRecommended();

  if (isLoading) return <SectionSkeleton title="Anime Rekomendasi" />;

  return (
    <SectionWrapper
      title="Anime Rekomendasi"
      description="Pilihan anime terbaik untuk kamu"
      icon={<Sparkles className="text-primary h-5 w-5" />}
      href="/anime?sort=recommended"
      linkText="Lihat Semua"
    >
      {!animeRecommended || animeRecommended.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="text-muted-foreground h-6 w-6" />}
          message="Rekomendasi anime sedang dimuat atau belum tersedia saat ini."
          href="/anime"
          linkText="Jelajahi Anime"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {animeRecommended.slice(0, 12).map((anime, index) => (
            <Card key={anime.urlId} item={anime} type="anime" index={index} />
          ))}
        </div>
      )}
    </SectionWrapper>
  );
}
