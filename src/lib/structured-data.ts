import type { Anime, AnimeEpisode, Komik, KomikChapter } from "@/types";
import { siteConfig } from "./site-config";

/**
 * Build ComicSeries JSON-LD for manga/manhwa/manhua detail pages.
 * Only includes fields that have actual data — no defaults or placeholders.
 */
export function buildComicSeriesJsonLd(
  komik: Komik,
  chapters: KomikChapter[]
): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ComicSeries",
    name: komik.title,
    url: `${siteConfig.url}/komik/${komik.manga_id}`,
    inLanguage: "id-ID",
  };

  if (komik.description) jsonLd.description = komik.description;
  if (komik.thumbnail || komik.cover) jsonLd.image = komik.thumbnail || komik.cover;
  if (komik.author) jsonLd.author = { "@type": "Person", name: komik.author };
  if (komik.genres && komik.genres.length > 0) jsonLd.genre = komik.genres;
  if (chapters.length > 0) jsonLd.numberOfIssues = chapters.length;

  const rating = komik.rating != null ? parseFloat(String(komik.rating)) : null;
  if (rating && rating > 0 && rating <= 10) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      bestRating: 10,
      // Use chapter count as a proxy for engagement when no real vote count exists
      ratingCount: Math.max(chapters.length, 10),
    };
  }

  return jsonLd;
}

/**
 * Build TVSeries JSON-LD for anime detail pages.
 * Only includes fields that have actual data.
 */
export function buildTVSeriesJsonLd(
  anime: Anime,
  episodes: AnimeEpisode[]
): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: anime.title,
    url: `${siteConfig.url}/anime/${anime.urlId}`,
    inLanguage: "id-ID",
  };

  const description = anime.description || anime.synopsis;
  if (description) jsonLd.description = description;
  if (anime.thumbnail || anime.cover) jsonLd.image = anime.thumbnail || anime.cover;
  if (anime.genres && anime.genres.length > 0) jsonLd.genre = anime.genres;
  if (episodes.length > 0) jsonLd.numberOfEpisodes = episodes.length;
  if (anime.studio) {
    jsonLd.productionCompany = { "@type": "Organization", name: anime.studio };
  }
  if (anime.year) jsonLd.startDate = String(anime.year);

  const rating = anime.rating != null ? parseFloat(String(anime.rating)) : null;
  if (rating && rating > 0 && rating <= 10) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      bestRating: 10,
      ratingCount: Math.max(episodes.length, 10),
    };
  }

  return jsonLd;
}
