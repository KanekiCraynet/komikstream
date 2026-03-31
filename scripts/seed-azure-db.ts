#!/usr/bin/env npx tsx
/**
 * Bulk seed script — fetches content from sankavollerei.com API (works from
 * non-Azure IPs) and pushes to Azure PostgreSQL via /api/internal/seed endpoint.
 *
 * Usage:
 *   npx tsx scripts/seed-azure-db.ts
 *
 * Env vars (reads from .env):
 *   CRON_SECRET — auth token for internal endpoints
 *   NEXT_PUBLIC_API_URL — sankavollerei.com base URL
 *
 * The script:
 *   1. Fetches anime list (latest + unlimited) from external API
 *   2. Fetches each anime's detail page
 *   3. Fetches komik list (popular + realtime) from external API
 *   4. Fetches each komik's detail page
 *   5. Sends batches to /api/internal/seed on kuromanga.me
 */

import "dotenv/config";

const SEED_URL = "https://kuromanga.me/api/internal/seed";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://www.sankavollerei.com";
const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 10;

if (!CRON_SECRET) {
  console.error("CRON_SECRET not set in .env");
  process.exit(1);
}

const ANIME_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://www.sankavollerei.com/anime/",
};

const COMIC_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "id-ID,id;q=0.9",
  Referer: "https://www.sankavollerei.com/",
};

async function fetchJson(url: string, headers: Record<string, string>) {
  const resp = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
  return resp.json();
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Anime ─────────────────────────────────────────────────────────

interface RawAnimeListItem {
  title?: string;
  animeId?: string;
  poster?: string;
  episodes?: number;
  type?: string;
  status?: string;
  score?: string;
  genreList?: Array<{ title?: string }>;
}

interface RawAnimeDetail {
  title?: string;
  poster?: string;
  score?: string;
  type?: string;
  status?: string;
  episodes?: number;
  genreList?: Array<{ title?: string }>;
  episodeList?: Array<{ title?: string; episodeId?: string; date?: string }>;
  synopsis?: { paragraphs?: string[] };
}

function transformAnimeDetail(data: RawAnimeDetail, urlId: string) {
  return {
    urlId,
    title: data.title || "",
    thumbnail: data.poster || "",
    cover: data.poster || "",
    synopsis: data.synopsis?.paragraphs?.join("\n") || undefined,
    rating: data.score,
    type: data.type,
    status: data.status,
    genres: data.genreList?.map((g) => g.title).filter(Boolean) || [],
    totalEpisodes: data.episodes,
    episodes:
      data.episodeList?.map((ep) => ({
        title: ep.title || "",
        url: ep.episodeId ? `/anime/episode/${ep.episodeId}` : undefined,
        date: ep.date,
      })) || [],
  };
}

async function fetchAllAnime() {
  console.log("Fetching anime lists...");
  const items: ReturnType<typeof transformAnimeDetail>[] = [];

  // Latest
  try {
    const res = await fetchJson(`${API_BASE}/anime/home`, ANIME_HEADERS);
    const list: RawAnimeListItem[] = res?.data?.recentEpisodes || [];
    const urlIds = list.map((a) => a.animeId).filter(Boolean) as string[];
    console.log(`  Latest: ${urlIds.length} anime IDs`);

    for (const urlId of urlIds) {
      try {
        const detail = await fetchJson(`${API_BASE}/anime/anime/${urlId}`, ANIME_HEADERS);
        if (detail?.data?.title) {
          items.push(transformAnimeDetail(detail.data, urlId));
        }
        await sleep(200); // Be polite
      } catch (err) {
        console.log(`  Skip ${urlId}: ${(err as Error).message}`);
      }
    }
  } catch (err) {
    console.log(`  Failed to fetch anime latest: ${(err as Error).message}`);
  }

  // Unlimited (more anime)
  try {
    const res = await fetchJson(`${API_BASE}/anime/anime?page=1&limit=50`, ANIME_HEADERS);
    const list: RawAnimeListItem[] = res?.data?.animeList || [];
    const existingIds = new Set(items.map((a) => a.urlId));
    const newIds = list
      .map((a) => a.animeId)
      .filter((id): id is string => Boolean(id) && !existingIds.has(id));
    console.log(`  Unlimited: ${newIds.length} new anime IDs`);

    for (const urlId of newIds) {
      try {
        const detail = await fetchJson(`${API_BASE}/anime/anime/${urlId}`, ANIME_HEADERS);
        if (detail?.data?.title) {
          items.push(transformAnimeDetail(detail.data, urlId));
        }
        await sleep(200);
      } catch (err) {
        console.log(`  Skip ${urlId}: ${(err as Error).message}`);
      }
    }
  } catch (err) {
    console.log(`  Failed to fetch anime unlimited: ${(err as Error).message}`);
  }

  return items;
}

// ─── Komik ─────────────────────────────────────────────────────────

interface RawKomikListItem {
  slug?: string;
  title?: string;
  image?: string;
}

interface RawKomikDetail {
  slug?: string;
  title?: string;
  image?: string;
  synopsis?: string;
  metadata?: { type?: string; author?: string; status?: string };
  genres?: Array<{ name?: string }>;
  chapters?: Array<{ chapter?: string; slug?: string; date?: string }>;
}

function transformKomikDetail(data: RawKomikDetail) {
  const chapters =
    data.chapters?.map((ch) => {
      const num = parseFloat(ch.chapter?.replace(/[^0-9.]/g, "") || "0");
      return {
        chapter_id: ch.slug || "",
        title: ch.chapter || "",
        chapter: num,
        date: ch.date,
      };
    }) || [];

  return {
    manga_id: data.slug || "",
    title: data.title || "",
    thumbnail: data.image || "",
    cover: data.image || "",
    description: data.synopsis || undefined,
    type: data.metadata?.type,
    status: data.metadata?.status,
    author: data.metadata?.author,
    genres: data.genres?.map((g) => g.name).filter(Boolean) || [],
    chapters,
    latestChapter: chapters[0]?.chapter_id,
  };
}

async function fetchAllKomik() {
  console.log("Fetching komik lists...");
  const items: ReturnType<typeof transformKomikDetail>[] = [];

  // Popular
  try {
    const res = await fetchJson(`${API_BASE}/comic/popular?page=1`, COMIC_HEADERS);
    const list: RawKomikListItem[] = Array.isArray(res) ? res : res?.data || [];
    const slugs = list.map((k) => k.slug).filter(Boolean) as string[];
    console.log(`  Popular: ${slugs.length} komik IDs`);

    for (const slug of slugs) {
      try {
        const detail = await fetchJson(`${API_BASE}/comic/comic/${slug}`, COMIC_HEADERS);
        if (detail?.title) {
          items.push(transformKomikDetail(detail));
        }
        await sleep(200);
      } catch (err) {
        console.log(`  Skip ${slug}: ${(err as Error).message}`);
      }
    }
  } catch (err) {
    console.log(`  Failed to fetch komik popular: ${(err as Error).message}`);
  }

  // Realtime / latest
  try {
    const res = await fetchJson(`${API_BASE}/comic/realtime?count=48`, COMIC_HEADERS);
    const list: RawKomikListItem[] = Array.isArray(res) ? res : res?.data || [];
    const existingIds = new Set(items.map((k) => k.manga_id));
    const newSlugs = list
      .map((k) => k.slug)
      .filter((s): s is string => Boolean(s) && !existingIds.has(s));
    console.log(`  Realtime: ${newSlugs.length} new komik IDs`);

    for (const slug of newSlugs) {
      try {
        const detail = await fetchJson(`${API_BASE}/comic/comic/${slug}`, COMIC_HEADERS);
        if (detail?.title) {
          items.push(transformKomikDetail(detail));
        }
        await sleep(200);
      } catch (err) {
        console.log(`  Skip ${slug}: ${(err as Error).message}`);
      }
    }
  } catch (err) {
    console.log(`  Failed to fetch komik realtime: ${(err as Error).message}`);
  }

  return items;
}

// ─── Seed to Azure ─────────────────────────────────────────────────

async function seedBatch(anime: unknown[], komik: unknown[]) {
  const resp = await fetch(SEED_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CRON_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ anime, komik }),
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Seed endpoint returned ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function main() {
  console.log("=== KuroManga Azure DB Bulk Seed ===\n");

  const anime = await fetchAllAnime();
  console.log(`\nTotal anime fetched: ${anime.length}`);

  const komik = await fetchAllKomik();
  console.log(`\nTotal komik fetched: ${komik.length}`);

  console.log("\nSeeding to Azure DB via /api/internal/seed...");

  let totalAnime = 0;
  let totalKomik = 0;

  // Send anime in batches
  for (let i = 0; i < anime.length; i += BATCH_SIZE) {
    const batch = anime.slice(i, i + BATCH_SIZE);
    try {
      const res = await seedBatch(batch, []);
      totalAnime += res.results?.anime?.success || 0;
      console.log(
        `  Anime batch ${Math.floor(i / BATCH_SIZE) + 1}: ${res.results?.anime?.success || 0} success`
      );
    } catch (err) {
      console.error(`  Anime batch failed: ${(err as Error).message}`);
    }
  }

  // Send komik in batches
  for (let i = 0; i < komik.length; i += BATCH_SIZE) {
    const batch = komik.slice(i, i + BATCH_SIZE);
    try {
      const res = await seedBatch([], batch);
      totalKomik += res.results?.komik?.success || 0;
      console.log(
        `  Komik batch ${Math.floor(i / BATCH_SIZE) + 1}: ${res.results?.komik?.success || 0} success`
      );
    } catch (err) {
      console.error(`  Komik batch failed: ${(err as Error).message}`);
    }
  }

  console.log(`\n=== Done! Seeded ${totalAnime} anime, ${totalKomik} komik ===`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
