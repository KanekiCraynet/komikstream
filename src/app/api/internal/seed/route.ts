import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { upsertCachedAnime, upsertCachedKomik } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Batch size for parallel upserts — balance between speed and memory
const BATCH_SIZE = 25;

interface AnimeInput {
  urlId: string;
  title: string;
  thumbnail?: string;
  cover?: string;
  synopsis?: string;
  description?: string;
  status?: string;
  type?: string;
  totalEpisodes?: number;
  rating?: string | number;
  genres?: string[];
  episodes?: unknown[];
}

interface KomikInput {
  manga_id: string;
  title: string;
  thumbnail?: string;
  cover?: string;
  description?: string;
  status?: string | number;
  type?: string;
  rating?: string | number;
  genres?: string[];
  author?: string;
  artist?: string;
  chapters?: unknown[];
  latestChapter?: string;
}

/**
 * Parse and normalize anime rating to number or null.
 */
function parseAnimeRating(rating: unknown): number | null {
  if (rating == null) return null;
  const parsed = typeof rating === "string" ? parseFloat(rating) : Number(rating);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Parse and normalize komik status to number or null.
 * 1 = ongoing, 0 = completed
 */
function parseKomikStatus(status: unknown): number | null {
  if (status == null) return null;
  if (typeof status === "number") return status;
  if (typeof status === "string") {
    return status.toLowerCase().includes("ongoing") ? 1 : 0;
  }
  return null;
}

/**
 * Process items in batches using Promise.allSettled for parallel execution.
 * Returns counts of successes and failures.
 */
async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  entityType: string
): Promise<{ success: number; error: number }> {
  const results = { success: 0, error: 0 };

  // Process in batches
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(batch.map(processor));

    // Count results
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.success++;
      } else {
        results.error++;
        logger.debug(`Seed: failed to upsert ${entityType}`, {
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }
  }

  return results;
}

/**
 * Internal seed endpoint — accepts pre-fetched anime/komik data and upserts to DB.
 * Used to populate Azure PostgreSQL from a machine that can reach the external API.
 *
 * POST /api/internal/seed
 * Authorization: Bearer <CRON_SECRET>
 * Body: { anime?: [...], komik?: [...] }
 *
 * Optimized: Uses batched parallel processing for significantly faster seeding.
 * Items are processed in batches of 25 using Promise.allSettled, which:
 * - Reduces total time from O(n) sequential to O(n/batch_size) parallel
 * - Handles individual failures gracefully without stopping the batch
 * - Provides detailed success/error counts
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const animeList: AnimeInput[] = Array.isArray(body?.anime) ? body.anime : [];
    const komikList: KomikInput[] = Array.isArray(body?.komik) ? body.komik : [];

    const startTime = Date.now();

    // Process anime in batches
    const animeResults = await processBatch(
      animeList,
      async (anime) => {
        await upsertCachedAnime({
          urlId: anime.urlId,
          title: anime.title,
          cover: anime.thumbnail || anime.cover || "",
          synopsis: anime.synopsis || anime.description || null,
          status: anime.status || null,
          type: anime.type || null,
          totalEpisodes: anime.totalEpisodes || null,
          rating: parseAnimeRating(anime.rating),
          genres: anime.genres || [],
          episodes: anime.episodes || [],
        });
      },
      "anime"
    );

    // Process komik in batches
    const komikResults = await processBatch(
      komikList,
      async (komik) => {
        await upsertCachedKomik({
          mangaId: komik.manga_id,
          title: komik.title,
          coverImage: komik.thumbnail || komik.cover || "",
          coverPortrait: komik.cover || null,
          synopsis: komik.description || null,
          status: parseKomikStatus(komik.status),
          type: komik.type || null,
          rating: parseAnimeRating(komik.rating), // Same parsing logic
          genres: komik.genres || [],
          authors: komik.author ? [komik.author] : [],
          artists: komik.artist ? [komik.artist] : [],
          chapters: komik.chapters || [],
          latestChapterId: komik.latestChapter || null,
        });
      },
      "komik"
    );

    const duration = Date.now() - startTime;
    const results = { anime: animeResults, komik: komikResults };

    logger.info("Seed completed", {
      ...results,
      duration: `${duration}ms`,
      batchSize: BATCH_SIZE,
    });

    return NextResponse.json({
      success: true,
      results,
      meta: {
        duration: `${duration}ms`,
        batchSize: BATCH_SIZE,
        totalItems: animeList.length + komikList.length,
      },
    });
  } catch (error) {
    logger.error("Seed failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Seed failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
