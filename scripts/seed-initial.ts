/**
 * Initial Database Seeding Script
 *
 * This script populates the database with initial data from the external API.
 * Target: ~50 anime + ~100 komik (Option A - minimal seed)
 *
 * Usage: npm run seed
 *
 * Note: This script uses rate limiting (2s between requests) to avoid
 * hitting Cloudflare rate limits. Estimated runtime: 30-60 minutes.
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// For Prisma 7.x with PostgreSQL (Supabase requires SSL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://www.sankavollerei.com";
const REQUEST_DELAY = 2000; // 2 seconds between requests

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAPI<T>(endpoint: string): Promise<T | null> {
  try {
    console.log(`  Fetching: ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: "https://www.sankavollerei.com/",
      },
    });

    if (!response.ok) {
      console.error(`  HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`  Fetch error: ${error}`);
    return null;
  }
}

// ==================== SHARED UPSERT HELPERS ====================

interface RawAnimeList {
  url: string;
  judul: string;
  cover: string;
  lastch?: string;
  lastup?: string;
  sinopsis?: string;
  genre?: string[];
  status?: string;
  score?: string;
  total_episode?: number;
}

/**
 * Upsert a single anime from raw API data.
 * `updateOverrides` allows callers to set extra fields on update (e.g. type: "Movie").
 */
async function upsertAnimeFromRaw(
  raw: RawAnimeList,
  updateOverrides: Record<string, unknown> = {}
): Promise<boolean> {
  try {
    await prisma.anime.upsert({
      where: { urlId: raw.url },
      update: {
        lastEpisode: raw.lastch || null,
        lastUpdate: raw.lastup || null,
        lastScraped: new Date(),
        ...updateOverrides,
      },
      create: {
        urlId: raw.url,
        title: raw.judul,
        cover: raw.cover,
        synopsis: raw.sinopsis || null,
        status: raw.status || null,
        rating: raw.score ? parseFloat(raw.score) : null,
        totalEpisodes: raw.total_episode || null,
        genres: raw.genre || [],
        episodes: [],
        lastEpisode: raw.lastch || null,
        lastUpdate: raw.lastup || null,
        ...updateOverrides,
      },
    });
    console.log(`    ✓ ${raw.judul}`);
    return true;
  } catch {
    console.log(`    ✗ ${raw.judul}`);
    return false;
  }
}

interface RawKomikTaxonomy {
  Genre?: Array<{ name: string; slug: string }>;
  Author?: Array<{ name: string; slug: string }>;
  Artist?: Array<{ name: string; slug: string }>;
  Format?: Array<{ name: string; slug: string }>;
}

interface RawKomik {
  manga_id: string;
  title: string;
  alternative_title?: string;
  description?: string;
  cover_image_url?: string;
  cover_portrait_url?: string;
  release_year?: string;
  status?: number;
  user_rate?: number;
  view_count?: number;
  bookmark_count?: number;
  latest_chapter_id?: string;
  latest_chapter_number?: number;
  latest_chapter_time?: string;
  country_id?: string;
  taxonomy?: RawKomikTaxonomy;
}

interface KomikResponse {
  retcode: number;
  data: RawKomik[];
}

/**
 * Upsert a single komik from raw API data.
 */
async function upsertKomikFromRaw(raw: RawKomik): Promise<boolean> {
  const genres = raw.taxonomy?.Genre?.map((g) => g.name) || [];
  const authors = raw.taxonomy?.Author || [];
  const artists = raw.taxonomy?.Artist || [];
  const format = raw.taxonomy?.Format?.[0]?.name || null;
  const latestDate = raw.latest_chapter_time ? new Date(raw.latest_chapter_time) : null;

  try {
    await prisma.komik.upsert({
      where: { mangaId: raw.manga_id },
      update: {
        latestChapterId: raw.latest_chapter_id || null,
        latestChapterNumber: raw.latest_chapter_number || null,
        latestChapterDate: latestDate,
        lastScraped: new Date(),
      },
      create: {
        mangaId: raw.manga_id,
        title: raw.title,
        alternativeTitle: raw.alternative_title || null,
        coverImage: raw.cover_image_url || "",
        coverPortrait: raw.cover_portrait_url || null,
        synopsis: raw.description || null,
        status: raw.status ?? null,
        type: format,
        releaseYear: raw.release_year || null,
        country: raw.country_id || null,
        rating: raw.user_rate || null,
        viewCount: raw.view_count ? BigInt(raw.view_count) : null,
        bookmarkCount: raw.bookmark_count || null,
        genres,
        authors,
        artists,
        latestChapterId: raw.latest_chapter_id || null,
        latestChapterNumber: raw.latest_chapter_number || null,
        latestChapterDate: latestDate,
        chapters: [],
      },
    });
    console.log(`    ✓ ${raw.title}`);
    return true;
  } catch {
    console.log(`    ✗ ${raw.title}`);
    return false;
  }
}

// ==================== ANIME SEEDING ====================

async function seedAnime(): Promise<number> {
  console.log("\n📺 SEEDING ANIME\n" + "=".repeat(50));
  let count = 0;

  // 1. Seed from recommended (3 pages = ~30 anime)
  console.log("\n📌 Fetching recommended anime...");
  for (let page = 1; page <= 3; page++) {
    console.log(`\n  Page ${page}:`);
    const data = await fetchAPI<RawAnimeList[]>(`/anime/recommended?page=${page}`);

    if (data && Array.isArray(data)) {
      for (const anime of data) {
        if (await upsertAnimeFromRaw(anime)) count++;
      }
    }
    await delay(REQUEST_DELAY);
  }

  // 2. Seed from latest (1 request = ~10-20 anime)
  console.log("\n📌 Fetching latest anime...");
  const latestData = await fetchAPI<RawAnimeList[]>("/anime/latest");

  if (latestData && Array.isArray(latestData)) {
    for (const anime of latestData) {
      if (await upsertAnimeFromRaw(anime)) count++;
    }
  }
  await delay(REQUEST_DELAY);

  // 3. Seed from movies (1 request = ~10-20 anime)
  console.log("\n📌 Fetching anime movies...");
  const movieData = await fetchAPI<RawAnimeList[]>("/anime/movie");

  if (movieData && Array.isArray(movieData)) {
    for (const anime of movieData) {
      if (await upsertAnimeFromRaw(anime, { type: "Movie" })) count++;
    }
  }

  return count;
}

// ==================== KOMIK SEEDING ====================

async function seedKomik(): Promise<number> {
  console.log("\n\n📚 SEEDING KOMIK\n" + "=".repeat(50));
  let count = 0;

  // 1. Seed from popular (10 pages = ~100 komik)
  console.log("\n📌 Fetching popular komik...");
  for (let page = 1; page <= 10; page++) {
    console.log(`\n  Page ${page}:`);
    const data = await fetchAPI<KomikResponse>(`/komik/popular?page=${page}`);

    if (data?.data && Array.isArray(data.data)) {
      for (const komik of data.data) {
        if (await upsertKomikFromRaw(komik)) count++;
      }
    }
    await delay(REQUEST_DELAY);
  }

  // 2. Seed from latest mirror (1 request)
  console.log("\n📌 Fetching latest komik (mirror)...");
  const latestData = await fetchAPI<KomikResponse>("/komik/latest?type=mirror");

  if (latestData?.data && Array.isArray(latestData.data)) {
    for (const komik of latestData.data) {
      if (await upsertKomikFromRaw(komik)) count++;
    }
  }

  return count;
}

// ==================== MAIN ====================

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🌱 KuroManga DATABASE SEEDING");
  console.log("=".repeat(60));
  console.log(`\nStarted at: ${new Date().toISOString()}`);
  console.log("Target: ~50 anime + ~100 komik");
  console.log("Rate limit: 2 seconds between requests");
  console.log("Estimated time: 30-60 minutes\n");

  const startTime = Date.now();

  // Create sync log
  const syncLog = await prisma.syncLog.create({
    data: {
      type: "initial_seed",
      status: "running",
    },
  });

  try {
    // Seed anime
    const animeCount = await seedAnime();
    await delay(REQUEST_DELAY);

    // Seed komik
    const komikCount = await seedKomik();

    const duration = Date.now() - startTime;

    // Update sync log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "success",
        itemsCount: animeCount + komikCount,
        completedAt: new Date(),
        duration,
      },
    });

    console.log("\n\n" + "=".repeat(60));
    console.log("✅ SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`\n  Anime seeded: ${animeCount}`);
    console.log(`  Komik seeded: ${komikCount}`);
    console.log(`  Total items: ${animeCount + komikCount}`);
    console.log(`  Duration: ${Math.round(duration / 1000)} seconds`);
    console.log(`\nCompleted at: ${new Date().toISOString()}\n`);
  } catch (error) {
    const duration = Date.now() - startTime;

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        errorMsg: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
        duration,
      },
    });

    console.error("\n\n❌ SEEDING FAILED!");
    console.error(error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
