import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { upsertCachedAnime, upsertCachedKomik } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Internal seed endpoint — accepts pre-fetched anime/komik data and upserts to DB.
 * Used to populate Azure PostgreSQL from a machine that can reach the external API.
 *
 * POST /api/internal/seed
 * Authorization: Bearer <CRON_SECRET>
 * Body: { anime?: [...], komik?: [...] }
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const animeList = Array.isArray(body?.anime) ? body.anime : [];
    const komikList = Array.isArray(body?.komik) ? body.komik : [];

    const results = { anime: { success: 0, error: 0 }, komik: { success: 0, error: 0 } };

    // Upsert anime
    for (const anime of animeList) {
      try {
        const rating =
          anime.rating != null
            ? typeof anime.rating === "string"
              ? parseFloat(anime.rating)
              : anime.rating
            : null;

        await upsertCachedAnime({
          urlId: anime.urlId,
          title: anime.title,
          cover: anime.thumbnail || anime.cover || "",
          synopsis: anime.synopsis || anime.description || null,
          status: anime.status || null,
          type: anime.type || null,
          totalEpisodes: anime.totalEpisodes || null,
          rating: Number.isFinite(rating) ? rating : null,
          genres: anime.genres || [],
          episodes: anime.episodes || [],
        });
        results.anime.success++;
      } catch (err) {
        results.anime.error++;
        logger.debug("Seed: failed to upsert anime", {
          urlId: anime.urlId,
          error: String(err),
        });
      }
    }

    // Upsert komik
    for (const komik of komikList) {
      try {
        const rating =
          komik.rating != null
            ? typeof komik.rating === "string"
              ? parseFloat(komik.rating)
              : Number(komik.rating)
            : null;
        const statusNum =
          komik.status != null
            ? typeof komik.status === "string"
              ? komik.status.toLowerCase().includes("ongoing")
                ? 1
                : 0
              : null
            : null;

        await upsertCachedKomik({
          mangaId: komik.manga_id,
          title: komik.title,
          coverImage: komik.thumbnail || komik.cover || "",
          coverPortrait: komik.cover || null,
          synopsis: komik.description || null,
          status: statusNum,
          type: komik.type || null,
          rating: Number.isFinite(rating) ? rating : null,
          genres: komik.genres || [],
          authors: komik.author ? [komik.author] : [],
          artists: komik.artist ? [komik.artist] : [],
          chapters: komik.chapters || [],
          latestChapterId: komik.latestChapter || null,
        });
        results.komik.success++;
      } catch (err) {
        results.komik.error++;
        logger.debug("Seed: failed to upsert komik", {
          mangaId: komik.manga_id,
          error: String(err),
        });
      }
    }

    logger.info("Seed completed", results);
    return NextResponse.json({ success: true, results });
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
