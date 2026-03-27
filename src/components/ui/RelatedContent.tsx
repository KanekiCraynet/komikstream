import { getKomikPopular, getAnimeRecommended } from "@/lib/api-client";
import { Card } from "@/components/ui";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface RelatedKomikProps {
  genres: string[];
  currentMangaId: string;
}

export async function RelatedKomik({ genres, currentMangaId }: RelatedKomikProps) {
  if (genres.length === 0) return null;

  let popular;
  try {
    popular = await getKomikPopular(1);
  } catch {
    return null;
  }

  const genreSet = new Set(genres.map((g) => g.toLowerCase()));
  const related = popular
    .filter(
      (k) => k.manga_id !== currentMangaId && k.genres?.some((g) => genreSet.has(g.toLowerCase()))
    )
    .slice(0, 6);

  if (related.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="text-primary h-5 w-5" />
        <h2 className="text-xl font-bold">Rekomendasi Komik</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {related.map((komik) => (
          <Card key={komik.manga_id} item={komik} type="komik" />
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link href="/komik" className="text-primary text-sm hover:underline">
          Lihat semua komik
        </Link>
      </div>
    </section>
  );
}

interface RelatedAnimeProps {
  genres: string[];
  currentUrlId: string;
}

export async function RelatedAnime({ genres, currentUrlId }: RelatedAnimeProps) {
  if (genres.length === 0) return null;

  let recommended;
  try {
    recommended = await getAnimeRecommended(1);
  } catch {
    return null;
  }

  const genreSet = new Set(genres.map((g) => g.toLowerCase()));
  const related = recommended
    .filter((a) => a.urlId !== currentUrlId && a.genres?.some((g) => genreSet.has(g.toLowerCase())))
    .slice(0, 6);

  if (related.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="text-primary h-5 w-5" />
        <h2 className="text-xl font-bold">Rekomendasi Anime</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {related.map((anime) => (
          <Card key={anime.urlId} item={anime} type="anime" />
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link href="/anime" className="text-primary text-sm hover:underline">
          Lihat semua anime
        </Link>
      </div>
    </section>
  );
}
