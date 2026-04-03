import { getCachedAnimeDetail } from "@/lib/api-cached";
import { siteConfig } from "@/lib/site-config";
import { truncate } from "@/lib/utils";
import AnimeVideoPlayer from "@/components/anime/AnimeVideoPlayer";
import EpisodeNavigation from "@/components/anime/EpisodeNavigation";
import { ChevronLeft, Home, List, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface WatchPageProps {
  params: Promise<{ animeUrlId: string; episodeId: string }>;
  searchParams: Promise<{ reso?: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { animeUrlId, episodeId } = await params;

  try {
    const anime = await getCachedAnimeDetail(animeUrlId);

    if (!anime) {
      return { title: "Anime tidak ditemukan" };
    }

    const episodes = Array.isArray(anime.episodes)
      ? anime.episodes
      : Array.isArray(anime.chapter)
        ? anime.chapter
        : [];
    const currentEpisode = episodes.find((ep) => (ep.url || ep.episodeId) === episodeId);
    const episodeTitle = currentEpisode?.title || `Episode ${episodeId}`;

    return {
      title: `${anime.title} - ${episodeTitle}`,
      description: truncate(
        `Nonton ${anime.title} ${episodeTitle} subtitle Indonesia gratis di ${siteConfig.name}`,
        160
      ),
      robots: {
        index: false,
        follow: true,
      },
      alternates: {
        canonical: `/watch/${animeUrlId}/${episodeId}`,
      },
    };
  } catch {
    return { title: "Nonton Anime" };
  }
}

export default async function AnimeWatchPage({ params, searchParams }: WatchPageProps) {
  const { animeUrlId, episodeId } = await params;
  const { reso = "480p" } = await searchParams;

  let anime;
  try {
    anime = await getCachedAnimeDetail(animeUrlId);
  } catch (error) {
    console.error("Error fetching anime detail:", error);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-yellow-500" />
        <h1 className="mb-2 text-2xl font-bold text-white">Gagal Memuat Data</h1>
        <p className="text-muted-foreground mb-6">
          Terjadi kesalahan saat memuat data anime. Silakan coba lagi nanti.
        </p>
        <Link href="/anime" className="text-primary hover:underline">
          Kembali ke Daftar Anime
        </Link>
      </div>
    );
  }

  if (!anime) {
    notFound();
  }

  // Get episodes list
  const episodes = Array.isArray(anime.episodes)
    ? anime.episodes
    : Array.isArray(anime.chapter)
      ? anime.chapter
      : [];

  // Find current, prev, next episode
  const currentIndex = episodes.findIndex((ep) => (ep.url || ep.episodeId) === episodeId);
  const currentEpisode = currentIndex >= 0 ? episodes[currentIndex] : null;
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  const breadcrumbJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Anime",
        item: `${siteConfig.url}/anime`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: anime.title,
        item: `${siteConfig.url}/anime/${animeUrlId}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: currentEpisode?.title || `Episode ${episodeId}`,
        item: `${siteConfig.url}/watch/${animeUrlId}/${episodeId}`,
      },
    ],
  });

  return (
    <div className="min-h-screen bg-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />

      {/* Header */}
      <header className="bg-background/95 border-border sticky top-0 z-50 border-b backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Back button */}
            <Link
              href={`/anime/${animeUrlId}`}
              className="hover:text-primary flex items-center gap-2 text-sm transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>

            {/* Title */}
            <div className="flex-1 px-4 text-center">
              <h1 className="truncate text-sm font-medium">{anime.title}</h1>
              <p className="text-muted-foreground truncate text-xs">
                {currentEpisode?.title || `Episode ${episodeId}`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="hover:bg-accent flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                aria-label="Beranda"
              >
                <Home className="h-4 w-4" />
              </Link>
              <Link
                href={`/anime/${animeUrlId}`}
                className="hover:bg-accent flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                aria-label="Daftar episode"
              >
                <List className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Episode Navigation (top) */}
      {episodes.length > 0 && (
        <EpisodeNavigation
          animeUrlId={animeUrlId}
          episodes={episodes}
          currentEpisodeId={episodeId}
          currentEpisode={currentEpisode}
          prevEpisode={prevEpisode}
          nextEpisode={nextEpisode}
          position="top"
        />
      )}

      {/* Video Player + Resolution */}
      <AnimeVideoPlayer episodeId={episodeId} animeUrlId={animeUrlId} reso={reso} />

      {/* Episode Navigation (bottom) */}
      {episodes.length > 0 && (
        <EpisodeNavigation
          animeUrlId={animeUrlId}
          episodes={episodes}
          currentEpisodeId={episodeId}
          currentEpisode={currentEpisode}
          prevEpisode={prevEpisode}
          nextEpisode={nextEpisode}
          position="bottom"
        />
      )}

      {/* Footer info */}
      <div className="bg-background border-border border-t">
        <div className="container mx-auto px-4 py-4">
          <p className="text-muted-foreground text-center text-xs">
            Jika video tidak bisa diputar, coba ganti resolusi atau gunakan browser lain.
          </p>
        </div>
      </div>
    </div>
  );
}
