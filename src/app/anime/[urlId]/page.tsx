import { Suspense } from "react";
import { RelatedAnime } from "@/components/ui/RelatedContent";
import { getCachedAnimeDetail } from "@/lib/api-cached";
import { siteConfig } from "@/lib/site-config";
import { getImageUrl, truncate } from "@/lib/utils";
import { Calendar, Clock, Download, Film, Play, Star, Tv, AlertTriangle } from "lucide-react";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { extractEpisodeNumber, getAnimeBatch, getAnimeLatest } from "@/lib/api-client";
import { buildTVSeriesJsonLd } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// ISR: regenerate detail pages every 30 minutes.
// Keeps Worker CPU low (serves cached HTML) while staying reasonably fresh.
export const revalidate = 1800;

export async function generateStaticParams() {
  // Skip SSG pre-rendering during CI builds — the external API rate-limits
  // bulk requests from datacenter IPs. ISR will render pages on first request.
  if (process.env.BUILD_TARGET === "azure") return [];

  try {
    const latest = await getAnimeLatest();
    return latest
      .filter((a) => a.urlId)
      .slice(0, 10)
      .map((a) => ({ urlId: a.urlId }));
  } catch {
    return [];
  }
}

interface DetailPageProps {
  params: Promise<{ urlId: string }>;
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { urlId } = await params;

  try {
    const anime = await getCachedAnimeDetail(urlId);

    if (!anime) {
      return { title: "Anime tidak ditemukan" };
    }

    const desc = truncate(
      anime.description || anime.synopsis || `Nonton ${anime.title} sub Indonesia secara gratis`,
      160
    );
    const img = anime.thumbnail || anime.poster || anime.cover || "";

    return {
      title: anime.title,
      description: desc,
      openGraph: {
        type: "video.tv_show",
        title: `${anime.title} | ${siteConfig.name}`,
        description: desc,
        images: img ? [{ url: img, alt: anime.title }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: anime.title,
        description: desc,
        images: img ? [img] : [],
      },
      alternates: {
        canonical: `/anime/${urlId}`,
      },
    };
  } catch {
    return { title: "Anime tidak ditemukan" };
  }
}

// ─── Async Detail Content (streams via Suspense) ────────────────────

async function AnimeDetailContent({ urlId }: { urlId: string }) {
  let anime;
  try {
    anime = await getCachedAnimeDetail(urlId);
  } catch (error) {
    console.error("Error fetching anime detail:", error);
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-yellow-500" />
        <h1 className="mb-2 text-2xl font-bold">Gagal Memuat Data</h1>
        <p className="text-muted-foreground mb-6">
          Terjadi kesalahan saat memuat detail anime. Silakan coba lagi nanti.
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

  const thumbnail = anime.thumbnail || anime.poster || anime.cover || "";
  const episodes = (
    Array.isArray(anime.episodes)
      ? anime.episodes
      : Array.isArray(anime.chapter)
        ? anime.chapter
        : []
  ).sort((a, b) => extractEpisodeNumber(a.title || "") - extractEpisodeNumber(b.title || ""));
  const description = anime.description || anime.synopsis || "";

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
        item: `${siteConfig.url}/anime/${urlId}`,
      },
    ],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildTVSeriesJsonLd(anime, episodes)) }}
      />
      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Anime", href: "/anime" },
          { label: anime.title },
        ]}
      />
      {/* Hero Section */}
      <div className="relative mb-8 overflow-hidden rounded-xl">
        {/* Background blur */}
        <div className="absolute inset-0">
          <Image
            src={getImageUrl(thumbnail)}
            alt=""
            fill
            className="object-cover opacity-30 blur-2xl"
            unoptimized
          />
          <div className="from-background via-background/80 to-background/40 absolute inset-0 bg-gradient-to-t" />
        </div>

        {/* Content */}
        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:p-8">
          {/* Poster */}
          <div className="mx-auto flex-shrink-0 md:mx-0">
            <div className="relative aspect-[2/3] w-48 overflow-hidden rounded-lg shadow-2xl md:w-56">
              <Image
                src={getImageUrl(thumbnail)}
                alt={anime.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end text-center md:text-left">
            {/* Type badge */}
            {anime.type && (
              <span className="bg-primary/90 text-primary-foreground mx-auto mb-3 inline-flex w-fit rounded px-3 py-1 text-xs font-medium capitalize md:mx-0">
                {anime.type}
              </span>
            )}

            <h1 className="mb-3 text-2xl font-bold md:text-4xl">{anime.title}</h1>

            {/* Meta info */}
            <div className="text-muted-foreground mb-4 flex flex-wrap items-center justify-center gap-4 text-sm md:justify-start">
              {anime.studio && (
                <span className="flex items-center gap-1">
                  <Tv className="h-4 w-4" />
                  {anime.studio}
                </span>
              )}
              {anime.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {anime.duration}
                </span>
              )}
              {(anime.year || anime.season) && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {anime.season} {anime.year}
                </span>
              )}
              {(anime.rating || anime.score) && (
                <span className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-yellow-500" />
                  {anime.rating || anime.score}
                </span>
              )}
            </div>

            {/* Status */}
            {anime.status && (
              <div className="mb-4 flex justify-center md:justify-start">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    anime.status.toLowerCase().includes("ongoing")
                      ? "bg-green-500/20 text-green-500"
                      : "bg-blue-500/20 text-blue-500"
                  }`}
                >
                  {anime.status}
                </span>
              </div>
            )}

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="mb-4 flex flex-wrap justify-center gap-2 md:justify-start">
                {anime.genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/anime/genre/${genre.toLowerCase().replace(/\s+/g, "-")}`}
                    className="bg-secondary hover:bg-secondary/80 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-muted-foreground line-clamp-4 max-w-2xl text-sm">{description}</p>
            )}

            {/* Action buttons */}
            {episodes.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link
                  href={`/anime/watch/${urlId}/${episodes[0].url || episodes[0].episodeId}`}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Tonton Episode Pertama
                </Link>
                {episodes.length > 1 && (
                  <Link
                    href={`/anime/watch/${urlId}/${episodes[episodes.length - 1].url || episodes[episodes.length - 1].episodeId}`}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
                  >
                    <Film className="h-4 w-4" />
                    Episode Terbaru
                  </Link>
                )}
              </div>
            )}

            {/* Share buttons */}
            <div className="mt-4 flex justify-center md:justify-start">
              <ShareButtons title={anime.title} />
            </div>
          </div>
        </div>
      </div>

      {/* Batch Download (separate Suspense so it doesn't block episode list) */}
      <Suspense fallback={null}>
        <AnimeBatchSection urlId={urlId} />
      </Suspense>

      {/* Episode List */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <Film className="text-primary h-5 w-5" />
          <h2 className="text-xl font-bold">Daftar Episode</h2>
          <span className="text-muted-foreground text-sm">({episodes.length} episode)</span>
        </div>

        {episodes.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {episodes.map((episode, index) => (
              <Link
                key={episode.url || episode.episodeId || index}
                href={`/anime/watch/${urlId}/${episode.url || episode.episodeId}`}
                className="border-border bg-card hover:border-primary/50 hover:bg-accent group flex items-center justify-between rounded-lg border p-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Play className="h-4 w-4 fill-current" />
                  </div>
                  <div>
                    <p className="line-clamp-1 font-medium">{episode.title}</p>
                    {episode.date && (
                      <p className="text-muted-foreground text-xs">{episode.date}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Film className="text-muted-foreground/50 mb-4 h-12 w-12" />
            <p className="text-lg font-medium">Belum ada episode</p>
            <p className="text-muted-foreground text-sm">Episode akan segera ditambahkan</p>
          </div>
        )}
      </section>

      {/* Related anime by genre */}
      <Suspense fallback={null}>
        <RelatedAnime genres={anime.genres ?? []} currentUrlId={urlId} />
      </Suspense>
    </>
  );
}

// ─── Batch Download Section ──────────────────────────────────────────

async function AnimeBatchSection({ urlId }: { urlId: string }) {
  let batch: Awaited<ReturnType<typeof getAnimeBatch>> | null;
  try {
    batch = await getAnimeBatch(urlId);
  } catch {
    return null;
  }
  if (!batch || batch.batchList.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <Download className="text-primary h-5 w-5" />
        <h2 className="text-xl font-bold">Download Batch</h2>
      </div>
      <div className="border-border bg-card space-y-4 rounded-lg border p-4">
        {batch.batchList.map((item, i) => (
          <div key={i}>
            {item.title && <h3 className="mb-2 text-sm font-medium">{item.title}</h3>}
            <div className="flex flex-wrap gap-2">
              {item.qualities.map((q, qi) => (
                <div key={qi} className="space-y-1">
                  <span className="text-muted-foreground text-xs font-medium">{q.resolution}</span>
                  <div className="flex flex-wrap gap-1">
                    {q.urls.map((u, ui) => (
                      <a
                        key={ui}
                        href={u.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-secondary hover:bg-secondary/80 rounded px-2 py-1 text-xs font-medium transition-colors"
                      >
                        {u.host}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Detail Skeleton ────────────────────────────────────────────────

function AnimeDetailSkeleton() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="bg-muted/50 relative mb-8 overflow-hidden rounded-xl">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:p-8">
          <div className="mx-auto flex-shrink-0 md:mx-0">
            <div className="bg-muted aspect-[2/3] w-48 animate-pulse rounded-lg md:w-56" />
          </div>
          <div className="flex flex-1 flex-col justify-end gap-3">
            <div className="bg-muted mx-auto h-6 w-20 animate-pulse rounded md:mx-0" />
            <div className="bg-muted mx-auto h-10 w-72 animate-pulse rounded md:mx-0" />
            <div className="mx-auto flex gap-4 md:mx-0">
              <div className="bg-muted h-5 w-24 animate-pulse rounded" />
              <div className="bg-muted h-5 w-20 animate-pulse rounded" />
              <div className="bg-muted h-5 w-16 animate-pulse rounded" />
            </div>
            <div className="bg-muted mx-auto h-7 w-20 animate-pulse rounded-full md:mx-0" />
            <div className="mx-auto flex gap-2 md:mx-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted h-7 w-16 animate-pulse rounded-full" />
              ))}
            </div>
            <div className="bg-muted mx-auto h-16 w-full max-w-2xl animate-pulse rounded md:mx-0" />
          </div>
        </div>
      </div>

      {/* Episode list skeleton */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-muted h-5 w-5 animate-pulse rounded" />
          <div className="bg-muted h-7 w-40 animate-pulse rounded" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-card flex items-center gap-3 rounded-lg border p-4"
            >
              <div className="bg-muted h-10 w-10 animate-pulse rounded-lg" />
              <div className="flex flex-col gap-1">
                <div className="bg-muted h-5 w-32 animate-pulse rounded" />
                <div className="bg-muted h-3 w-20 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ─── Page Component ─────────────────────────────────────────────────

export default async function AnimeDetailPage({ params }: DetailPageProps) {
  const { urlId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<AnimeDetailSkeleton />}>
        <AnimeDetailContent urlId={urlId} />
      </Suspense>
    </div>
  );
}
