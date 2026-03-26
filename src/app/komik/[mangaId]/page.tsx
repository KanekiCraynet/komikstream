import { Suspense } from "react";
import { getCachedKomikDetail, getKomikChapterList } from "@/lib/api-cached";
import { getKomikPopular } from "@/lib/api-client";
import { siteConfig } from "@/lib/site-config";
import { getImageUrl, truncate } from "@/lib/utils";
import { Book, BookOpen, Clock, Star, User, AlertTriangle } from "lucide-react";
import { buildComicSeriesJsonLd } from "@/lib/structured-data";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// ISR: regenerate detail pages every 30 minutes.
// Keeps Worker CPU low (serves cached HTML) while staying reasonably fresh.
export const revalidate = 1800;

export async function generateStaticParams() {
  try {
    const popular = await getKomikPopular(1);
    return popular
      .filter((k) => k.manga_id)
      .slice(0, 30)
      .map((k) => ({ mangaId: k.manga_id }));
  } catch {
    return [];
  }
}

interface DetailPageProps {
  params: Promise<{ mangaId: string }>;
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { mangaId } = await params;

  try {
    const komik = await getCachedKomikDetail(mangaId);

    if (!komik) {
      return { title: "Komik tidak ditemukan" };
    }

    return {
      title: komik.title,
      description: truncate(komik.description || `Baca ${komik.title} secara gratis`, 160),
      openGraph: {
        images: komik.thumbnail ? [komik.thumbnail] : [],
      },
      alternates: {
        canonical: `/komik/${mangaId}`,
      },
    };
  } catch {
    return { title: "Komik tidak ditemukan" };
  }
}

// ─── Async Detail Content (streams via Suspense) ────────────────────

async function KomikDetailContent({ mangaId }: { mangaId: string }) {
  let komik;
  let chapters: Awaited<ReturnType<typeof getKomikChapterList>> = [];

  try {
    [komik, chapters] = await Promise.all([
      getCachedKomikDetail(mangaId),
      getKomikChapterList(mangaId),
    ]);
  } catch (error) {
    console.error("Error fetching komik detail:", error);
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-yellow-500" />
        <h1 className="mb-2 text-2xl font-bold">Gagal Memuat Data</h1>
        <p className="text-muted-foreground mb-6">
          Terjadi kesalahan saat memuat detail komik. Silakan coba lagi nanti.
        </p>
        <Link href="/komik" className="text-primary hover:underline">
          Kembali ke Daftar Komik
        </Link>
      </div>
    );
  }

  if (!komik) {
    notFound();
  }

  const thumbnail = komik.thumbnail || komik.cover || "";

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
        name: "Komik",
        item: `${siteConfig.url}/komik`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: komik.title,
        item: `${siteConfig.url}/komik/${mangaId}`,
      },
    ],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildComicSeriesJsonLd(komik, chapters)),
        }}
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
          {/* Cover */}
          <div className="mx-auto flex-shrink-0 md:mx-0">
            <div className="relative aspect-[2/3] w-48 overflow-hidden rounded-lg shadow-2xl md:w-56">
              <Image
                src={getImageUrl(thumbnail)}
                alt={komik.title}
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
            {komik.type && (
              <span className="bg-primary/90 text-primary-foreground mx-auto mb-3 inline-flex w-fit rounded px-3 py-1 text-xs font-medium capitalize md:mx-0">
                {komik.type}
              </span>
            )}

            <h1 className="mb-3 text-2xl font-bold md:text-4xl">{komik.title}</h1>

            {/* Meta info */}
            <div className="text-muted-foreground mb-4 flex flex-wrap items-center justify-center gap-4 text-sm md:justify-start">
              {komik.author && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {komik.author}
                </span>
              )}
              {komik.status && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {komik.status}
                </span>
              )}
              {komik.rating && (
                <span className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-yellow-500" />
                  {komik.rating}
                </span>
              )}
            </div>

            {/* Genres */}
            {komik.genres && komik.genres.length > 0 && (
              <div className="mb-4 flex flex-wrap justify-center gap-2 md:justify-start">
                {komik.genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/komik/genre/${genre.toLowerCase().replace(/\s+/g, "-")}`}
                    className="bg-secondary hover:bg-secondary/80 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            )}

            {/* Description */}
            {komik.description && (
              <p className="text-muted-foreground line-clamp-4 max-w-2xl text-sm">
                {komik.description}
              </p>
            )}

            {/* Action buttons */}
            {chapters.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link
                  href={`/komik/${mangaId}/${chapters[0].chapter_id}`}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Baca Chapter Pertama
                </Link>
                <Link
                  href={`/komik/${mangaId}/${chapters[chapters.length - 1].chapter_id}`}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
                >
                  <Book className="h-4 w-4" />
                  Chapter Terbaru
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter List */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <Book className="text-primary h-5 w-5" />
          <h2 className="text-xl font-bold">Daftar Chapter</h2>
          <span className="text-muted-foreground text-sm">({chapters.length} chapter)</span>
        </div>

        {chapters.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => (
              <Link
                key={chapter.chapter_id}
                href={`/komik/${mangaId}/${chapter.chapter_id}`}
                className="border-border bg-card hover:border-primary/50 hover:bg-accent group flex items-center justify-between rounded-lg border p-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="line-clamp-1 font-medium">{chapter.title}</p>
                    {chapter.date && (
                      <p className="text-muted-foreground text-xs">{chapter.date}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Book className="text-muted-foreground/50 mb-4 h-12 w-12" />
            <p className="text-lg font-medium">Belum ada chapter</p>
            <p className="text-muted-foreground text-sm">Chapter akan segera ditambahkan</p>
          </div>
        )}
      </section>
    </>
  );
}

// ─── Detail Skeleton ────────────────────────────────────────────────

function KomikDetailSkeleton() {
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
            <div className="mx-auto flex gap-2 md:mx-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted h-7 w-16 animate-pulse rounded-full" />
              ))}
            </div>
            <div className="bg-muted mx-auto h-16 w-full max-w-2xl animate-pulse rounded md:mx-0" />
          </div>
        </div>
      </div>

      {/* Chapter list skeleton */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-muted h-5 w-5 animate-pulse rounded" />
          <div className="bg-muted h-7 w-40 animate-pulse rounded" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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

export default async function KomikDetailPage({ params }: DetailPageProps) {
  const { mangaId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<KomikDetailSkeleton />}>
        <KomikDetailContent mangaId={mangaId} />
      </Suspense>
    </div>
  );
}
