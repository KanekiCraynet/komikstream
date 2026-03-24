import { NextRequest, NextResponse } from "next/server";
import { searchAnime, searchKomik } from "@/lib/api-client";
import { handleApiError, validateSearchParams } from "@/lib/api-helpers";
import { ExternalApiError } from "@/lib/errors";
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
 */
export async function GET(request: NextRequest) {
  try {
    const { q: query, type, limit } = validateSearchParams(request, searchParamsSchema);

    const results: SearchResult[] = [];

    // Search anime
    if (!type || type === "anime") {
      try {
        const anime = await searchAnime(query);
        const animeResults = anime.slice(0, type === "anime" ? limit : Math.floor(limit / 2));

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
        const msg = error instanceof Error ? error.message : String(error);
        throw new ExternalApiError(`Anime search failed: ${msg}`, {
          url: `searchAnime(${query})`,
        });
      }
    }

    // Search komik
    if (!type || type === "komik") {
      try {
        const komik = await searchKomik(query);
        const komikResults = komik.slice(0, type === "komik" ? limit : Math.floor(limit / 2));

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
        const msg = error instanceof Error ? error.message : String(error);
        throw new ExternalApiError(`Komik search failed: ${msg}`, {
          url: `searchKomik(${query})`,
        });
      }
    }

    return NextResponse.json({
      query,
      type: type || "all",
      count: results.length,
      results,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/search");
  }
}
