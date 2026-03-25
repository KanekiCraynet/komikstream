import { SearchBar } from "@/components/ui";
import { Book, Film, Sparkles } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="from-primary/5 via-background to-background relative overflow-hidden bg-gradient-to-b py-20 md:py-32">
      {/* Subtle background accents — no GPU-heavy blur/pulse */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-2xl" />
        <div className="bg-accent/5 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-2xl" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="animate-fade-in mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-6">
            <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Platform Baca Komik Terlengkap
            </span>
          </div>

          <h1 className="mb-6 text-5xl font-bold md:text-6xl lg:text-7xl">
            Baca Komik & Nonton Anime <span className="gradient-text">Favorit Kamu</span>
          </h1>

          <p className="text-muted-foreground mb-10 max-w-2xl text-lg md:text-xl">
            Koleksi terlengkap manga, manhwa, dan manhua dengan subtitle Indonesia. Update setiap
            hari, 100% gratis selamanya!
          </p>

          <div className="w-full max-w-2xl">
            <SearchBar className="shadow-primary/10 w-full shadow-lg" />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/komik"
              className="bg-primary text-primary-foreground hover:bg-primary/90 group shadow-primary/25 hover:shadow-primary/30 flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <Book className="h-5 w-5 transition-transform group-hover:scale-110" />
              Jelajahi Komik
            </Link>
            <Link
              href="/anime"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 group flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium shadow-lg transition-all hover:scale-105"
            >
              <Film className="h-5 w-5 transition-transform group-hover:scale-110" />
              Jelajahi Anime
            </Link>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
                <Book className="text-primary h-5 w-5" />
              </div>
              <div className="mb-1 text-sm font-semibold">Manga & Manhwa</div>
              <div className="text-muted-foreground text-xs">Koleksi terlengkap</div>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
                <Film className="text-primary h-5 w-5" />
              </div>
              <div className="mb-1 text-sm font-semibold">Anime Sub Indo</div>
              <div className="text-muted-foreground text-xs">Streaming gratis</div>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
                <Sparkles className="text-primary h-5 w-5" />
              </div>
              <div className="mb-1 text-sm font-semibold">Update Harian</div>
              <div className="text-muted-foreground text-xs">Konten terbaru setiap hari</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
