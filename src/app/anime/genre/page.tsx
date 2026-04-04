import { getAnimeGenres } from "@/lib/api";
import Link from "next/link";
import { Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "Genre Anime",
  description: "Jelajahi anime berdasarkan genre favorit kamu",
};

export default async function AnimeGenrePage() {
  let genres: Awaited<ReturnType<typeof getAnimeGenres>>;
  try {
    genres = await getAnimeGenres();
  } catch {
    // API unavailable at build time — render empty, ISR will retry
    genres = [];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Tags className="text-primary h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Genre Anime</h1>
          <p className="text-muted-foreground">Pilih genre untuk menemukan anime favorit</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {genres.map((genre) => (
          <Link
            key={genre.genreId}
            href={`/anime/genre/${genre.genreId}`}
            className={cn(
              "rounded-xl border px-4 py-3 text-center font-medium transition-all",
              "bg-card/80 border-border/50 backdrop-blur-sm",
              "hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
              "hover:shadow-primary/20 hover:shadow-lg"
            )}
          >
            {genre.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
