import { prisma } from "~/lib/db.server";
import { extractGenres, parseMangaMetadata, type GenreItem } from "~/lib/manga-types";

// ponytail: 5-minute in-process cache — genre list changes only when the seed
// runs. Swap for a real cache/table if catalog writes become frequent.
const TTL_MS = 5 * 60 * 1000;
let cache: { at: number; items: GenreItem[] } | null = null;

/** Unique genres across the whole catalog, alphabetical. Reads both the
 *  `genres` column and the genres nested in chapter metadata. */
export async function listGenres(): Promise<GenreItem[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items;

  const rows = await prisma.komik.findMany({ select: { genres: true, chapters: true } });
  const merged = new Map<string, string>();
  for (const row of rows) {
    for (const genre of extractGenres(row.genres)) {
      if (!merged.has(genre.name)) merged.set(genre.name, genre.slug);
    }
    for (const genre of extractGenres(parseMangaMetadata(row.chapters).genres)) {
      if (!merged.has(genre.name)) merged.set(genre.name, genre.slug);
    }
  }

  const items = [...merged.entries()]
    .map(([name, slug]) => ({ name, slug }))
    .sort((a, b) => a.name.localeCompare(b.name));
  cache = { at: Date.now(), items };
  return items;
}
