import { NextRequest, NextResponse } from "next/server";
import { searchAnime, searchKomik } from "@/lib/api";
import { handleApiError, validateSearchParams } from "@/lib/api-helpers";
import { searchParamsSchema } from "@/lib/validations/search";

export const dynamic = "force-dynamic";

interface SearchResult {
  type: "anime" | "komik";
  id: string;
  title: string;
  thumbnail: string | null | undefined;
  rating: string | number | null;
  status: string | null;
  genres: string[];
  urlId?: string;
  mangaId?: string;
}

/**
 * GET /api/search?q=query&type=anime|komik&limit=20
 * Search via external API
 *
 * Optimized: Uses Promise.allSettled for parallel execution when searching
 * both anime and komik. Partial failures are handled gracefully - successful
 * results are returned even if one source fails.
 */
export async function GET(request: NextRequest) {
  try {
    const { q: query, type, limit } = validateSearchParams(request, searchParamsSchema);

    const results: SearchResult[] = [];
    const errors: string[] = [];

    // Determine which searches to run
    const searchAnimeEnabled = !type || type === "anime";
    const searchKomikEnabled = !type || type === "komik";

    // Calculate limits for each type
    const animeLimit = type === "anime" ? limit : Math.floor(limit / 2);
    const komikLimit = type === "komik" ? limit : Math.floor(limit / 2);

    // Run searches in parallel when both are enabled
    if (searchAnimeEnabled && searchKomikEnabled) {
      const [animeResult, komikResult] = await Promise.allSettled([
        searchAnime(query),
        searchKomik(query),
      ]);

      // Process anime results
      if (animeResult.status === "fulfilled") {
        const animeResults = animeResult.value.slice(0, animeLimit);
        results.push(
          ...animeResults.map((a) => ({
            type: "anime" as const,
            id: a.urlId,
            urlId: a.urlId,
            title: a.title,
            thumbnail: a.thumbnail,
            rating: a.rating ?? null,
            status: a.status ?? null,
            genres: a.genres || [],
          }))
        );
      } else {
        errors.push(
          `Anime search failed: ${animeResult.reason?.message || String(animeResult.reason)}`
        );
      }

      // Process komik results
      if (komikResult.status === "fulfilled") {
        const komikResults = komikResult.value.slice(0, komikLimit);
        results.push(
          ...komikResults.map((k) => ({
            type: "komik" as const,
            id: k.manga_id,
            mangaId: k.manga_id,
            title: k.title,
            thumbnail: k.thumbnail,
            rating: k.rating ?? null,
            status: k.status ?? null,
            genres: k.genres || [],
          }))
        );
      } else {
        errors.push(
          `Komik search failed: ${komikResult.reason?.message || String(komikResult.reason)}`
        );
      }
    } else if (searchAnimeEnabled) {
      // Search anime only
      try {
        const anime = await searchAnime(query);
        const animeResults = anime.slice(0, animeLimit);
        results.push(
          ...animeResults.map((a) => ({
            type: "anime" as const,
            id: a.urlId,
            urlId: a.urlId,
            title: a.title,
            thumbnail: a.thumbnail,
            rating: a.rating ?? null,
            status: a.status ?? null,
            genres: a.genres || [],
          }))
        );
      } catch (error) {
        errors.push(
          `Anime search failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else if (searchKomikEnabled) {
      // Search komik only
      try {
        const komik = await searchKomik(query);
        const komikResults = komik.slice(0, komikLimit);
        results.push(
          ...komikResults.map((k) => ({
            type: "komik" as const,
            id: k.manga_id,
            mangaId: k.manga_id,
            title: k.title,
            thumbnail: k.thumbnail,
            rating: k.rating ?? null,
            status: k.status ?? null,
            genres: k.genres || [],
          }))
        );
      } catch (error) {
        errors.push(
          `Komik search failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Return results with any partial errors noted
    const response: {
      query: string;
      type: string;
      count: number;
      results: SearchResult[];
      errors?: string[];
    } = {
      query,
      type: type || "all",
      count: results.length,
      results,
    };

    // Include errors array only if there were partial failures
    if (errors.length > 0 && results.length > 0) {
      response.errors = errors;
    }

    // If all searches failed, return error response
    if (errors.length > 0 && results.length === 0) {
      return NextResponse.json({ error: "Search failed", details: errors }, { status: 502 });
    }

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, "GET /api/search");
  }
}
