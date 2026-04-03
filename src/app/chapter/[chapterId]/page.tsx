import { getKomikChapterData } from "@/lib/api-client";
import { siteConfig } from "@/lib/site-config";
import { truncate } from "@/lib/utils";
import { MangaImage } from "@/components/ui/MangaImage";
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, Home, List } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

// ISR: regenerate chapter reader every 10 minutes.
// Avoids hitting the external API on every request while keeping images fresh.
export const revalidate = 600;

interface ReaderPageProps {
  params: Promise<{ chapterId: string }>;
}

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  const { chapterId } = await params;

  try {
    const chapterData = await getKomikChapterData(chapterId);

    if (!chapterData) {
      return { title: "Chapter tidak ditemukan" };
    }

    return {
      title: `${chapterData.mangaTitle} - ${chapterData.chapterTitle}`,
      description: truncate(
        `Baca ${chapterData.mangaTitle} ${chapterData.chapterTitle} Bahasa Indonesia secara gratis di ${siteConfig.name}. Update terbaru!`,
        160
      ),
      alternates: {
        canonical: `/chapter/${chapterId}`,
      },
    };
  } catch {
    return { title: "Chapter tidak ditemukan" };
  }
}

export default async function ChapterReaderPage({ params }: ReaderPageProps) {
  const { chapterId } = await params;

  let chapterData;
  try {
    chapterData = await getKomikChapterData(chapterId);
  } catch {
    // Let the route error boundary handle API failures
    throw new Error("Gagal memuat data chapter. Silakan coba lagi.");
  }

  if (!chapterData) {
    notFound();
  }

  const { mangaTitle, mangaSlug, chapterTitle, navigation, images } = chapterData;

  if (!images || images.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center">
        <BookOpen className="mb-4 h-16 w-16 text-yellow-500" />
        <h1 className="mb-2 text-2xl font-bold text-white">Gambar Tidak Tersedia</h1>
        <p className="text-muted-foreground mb-6">
          Gambar chapter tidak tersedia saat ini. Silakan coba lagi nanti.
        </p>
        <Link href={`/komik/${mangaSlug}`} className="text-primary hover:underline">
          Kembali ke detail komik
        </Link>
      </div>
    );
  }

  // Get image URLs
  const imageUrls = images.map((img) => img.url);

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
        name: mangaTitle,
        item: `${siteConfig.url}/komik/${mangaSlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: chapterTitle,
        item: `${siteConfig.url}/chapter/${chapterId}`,
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
              href={`/komik/${mangaSlug}`}
              className="hover:text-primary flex items-center gap-2 text-sm transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>

            {/* Title */}
            <div className="flex-1 px-4 text-center">
              <h1 className="truncate text-sm font-medium">{mangaTitle}</h1>
              <p className="text-muted-foreground truncate text-xs">{chapterTitle}</p>
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
                href={`/komik/${mangaSlug}`}
                className="hover:bg-accent flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                aria-label="Daftar chapter"
              >
                <List className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation (top) */}
      <nav className="bg-background border-border border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {navigation.previousChapter ? (
              <Link
                href={`/chapter/${navigation.previousChapter}`}
                className="text-primary flex items-center gap-2 text-sm hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Prev
              </Link>
            ) : (
              <span className="text-muted-foreground text-sm">
                <ArrowLeft className="mr-1 inline h-4 w-4" />
                Prev
              </span>
            )}

            <span className="text-sm font-medium">{chapterTitle}</span>

            {navigation.nextChapter ? (
              <Link
                href={`/chapter/${navigation.nextChapter}`}
                className="text-primary flex items-center gap-2 text-sm hover:underline"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="text-muted-foreground text-sm">
                Next
                <ArrowRight className="ml-1 inline h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Images */}
      <main className="flex flex-col items-center bg-black py-4">
        {imageUrls.map((url, index) => (
          <div key={index} className="relative w-full max-w-4xl">
            <MangaImage
              src={url}
              alt={`${mangaTitle} ${chapterTitle} - Halaman ${index + 1}`}
              priority={index < 3}
            />
          </div>
        ))}
      </main>

      {/* Navigation (bottom) */}
      <nav className="bg-background border-border sticky bottom-0 border-t pb-[env(safe-area-inset-bottom)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {navigation.previousChapter ? (
              <Link
                href={`/chapter/${navigation.previousChapter}`}
                className="bg-secondary hover:bg-secondary/80 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Chapter Sebelumnya
              </Link>
            ) : (
              <div />
            )}

            {navigation.nextChapter ? (
              <Link
                href={`/chapter/${navigation.nextChapter}`}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Chapter Selanjutnya
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href={`/komik/${mangaSlug}`}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Kembali ke Detail
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
