/**
 * Homepage API aggregator
 * Combines data from multiple sources for the homepage
 */

import { getKomikLatest, getKomikPopular } from "./komik";
import { getAnimeLatest, getAnimeRecommended } from "./anime";

/**
 * Fetch all homepage data in parallel.
 * Each source is wrapped with catch to ensure partial failures don't break the page.
 */
export async function getHomepageData() {
  const [komikLatest, komikPopular, animeLatest, animeRecommended] = await Promise.all([
    getKomikLatest().catch(() => []),
    getKomikPopular(1).catch(() => []),
    getAnimeLatest().catch(() => []),
    getAnimeRecommended(1).catch(() => []),
  ]);

  return {
    komikLatest,
    komikPopular,
    animeLatest,
    animeRecommended,
  };
}
