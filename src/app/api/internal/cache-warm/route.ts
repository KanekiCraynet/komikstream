import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getCachedAnimeDetail, getCachedKomikDetail } from "@/lib/api-cached";
import {
  getAnimeLatest,
  getAnimeUnlimited,
  getKomikPopular,
  getKomikRealtime,
} from "@/lib/api";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Process IDs in batches with concurrency control. */
async function warmBatch(
  ids: string[],
  fetcher: (id: string) => Promise<unknown>,
  concurrency = 5
): Promise<{ successes: number; errors: number }> {
  let successes = 0;
  let errors = 0;
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map(fetcher));
    for (const r of results) {
      if (r.status === "fulfilled") successes++;
      else errors++;
    }
  }
  return { successes, errors };
}

/**
 * Internal cache warming endpoint.
 * Proactively refreshes the most popular content in KV + DB caches.
 * Protected by CRON_SECRET bearer token.
 *
 * POST /api/internal/cache-warm
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body for deep warm flag
  let deep = false;
  try {
    const body = await request.json();
    deep = body?.deep === true;
  } catch {
    // No body or invalid JSON — standard warm
  }

  const startTime = Date.now();
  const results = { anime: 0, komik: 0, errors: 0 };

  // Warm anime: fetch latest list, then warm each detail page cache
  try {
    const animeList = await getAnimeLatest();
    const animeIds = animeList
      .filter((a) => a.urlId)
      .slice(0, 20)
      .map((a) => a.urlId);

    const r = await warmBatch(animeIds, getCachedAnimeDetail);
    results.anime += r.successes;
    results.errors += r.errors;
  } catch (err) {
    logger.warn("Cache warm: failed to fetch anime list", { error: String(err) });
  }

  // Warm komik: fetch popular list, then warm each detail page cache
  try {
    const komikList = await getKomikPopular(1);
    const komikIds = komikList
      .filter((k) => k.manga_id)
      .slice(0, 20)
      .map((k) => k.manga_id);

    const r = await warmBatch(komikIds, getCachedKomikDetail);
    results.komik += r.successes;
    results.errors += r.errors;
  } catch (err) {
    logger.warn("Cache warm: failed to fetch komik list", { error: String(err) });
  }

  // Deep warm: fetch broader data using unlimited/realtime endpoints
  if (deep) {
    try {
      const allAnime = await getAnimeUnlimited();
      const extraAnimeIds = allAnime
        .filter((a) => a.urlId)
        .slice(20, 50) // skip first 20 (already warmed above)
        .map((a) => a.urlId);

      const r = await warmBatch(extraAnimeIds, getCachedAnimeDetail);
      results.anime += r.successes;
      results.errors += r.errors;
    } catch (err) {
      logger.warn("Cache warm: deep anime warm failed", { error: String(err) });
    }

    try {
      const realtimeKomik = await getKomikRealtime({ count: 48 });
      const extraKomikIds = realtimeKomik
        .filter((k) => k.manga_id)
        .slice(0, 30)
        .map((k) => k.manga_id);

      const r = await warmBatch(extraKomikIds, getCachedKomikDetail);
      results.komik += r.successes;
      results.errors += r.errors;
    } catch (err) {
      logger.warn("Cache warm: deep komik warm failed", { error: String(err) });
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info("Cache warm completed", { ...results, durationMs, deep });

  return NextResponse.json({ success: true, ...results, durationMs, deep });
}
