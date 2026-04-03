import "server-only";

// Import from @prisma/client (NOT /edge) — with driver adapters (adapter-pg),
// the /edge subpath must not be used. OpenNext's esbuild uses the `workerd`
// export condition to resolve the correct WASM-based edge build automatically.
import { Prisma, PrismaClient } from "@prisma/client";
import { getSafePrisma } from "@/lib/prisma";

// Re-export error types from db-errors.ts for backward compatibility.
// Extracted to break the transitive import chain: errors.ts → db.ts → @prisma/client
export {
  PRISMA_ERROR,
  DatabaseError,
  UniqueConstraintError,
  RecordNotFoundError,
  DatabaseUnavailableError,
} from "@/lib/db-errors";

import {
  PRISMA_ERROR,
  DatabaseError,
  UniqueConstraintError,
  RecordNotFoundError,
  DatabaseUnavailableError,
} from "@/lib/db-errors";

// ─── Helper: Map Prisma errors to typed errors ──────────────────────

function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case PRISMA_ERROR.UNIQUE_CONSTRAINT: {
        const target = error.meta?.target;
        const fields = Array.isArray(target) ? target : undefined;
        throw new UniqueConstraintError(fields);
      }
      case PRISMA_ERROR.NOT_FOUND: {
        const model = error.meta?.modelName as string | undefined;
        throw new RecordNotFoundError(model);
      }
      case PRISMA_ERROR.FOREIGN_KEY: {
        throw new DatabaseError(
          "Referenced record does not exist",
          PRISMA_ERROR.FOREIGN_KEY,
          400,
          error.meta as Record<string, unknown> | undefined
        );
      }
      default:
        throw new DatabaseError(
          `Database error: ${error.message}`,
          error.code,
          500,
          error.meta as Record<string, unknown> | undefined
        );
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new DatabaseError("Failed to connect to database", "DB_INIT_ERROR", 503);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new DatabaseError("Invalid query parameters", "VALIDATION_ERROR", 400);
  }

  // Re-throw DatabaseError as-is
  if (error instanceof DatabaseError) {
    throw error;
  }

  // Unknown error
  throw new DatabaseError(
    error instanceof Error ? error.message : "Unknown database error",
    "UNKNOWN",
    500
  );
}

// ─── Core DB accessor ───────────────────────────────────────────────

/**
 * Get a PrismaClient instance, throwing DatabaseUnavailableError if
 * the database is not configured. Use this in db service functions.
 */
export async function getDb(): Promise<PrismaClient> {
  const prisma = await getSafePrisma();
  if (!prisma) {
    throw new DatabaseUnavailableError();
  }
  return prisma;
}

// ─── DB Service: Users ──────────────────────────────────────────────

export async function findUserByClerkId(clerkId: string) {
  const db = await getDb();
  try {
    return await db.user.findUnique({ where: { clerkId } });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function upsertUser(data: {
  clerkId: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
}) {
  const db = await getDb();
  try {
    return await db.user.upsert({
      where: { clerkId: data.clerkId },
      update: {
        email: data.email,
        name: data.name ?? null,
        imageUrl: data.imageUrl ?? null,
        updatedAt: new Date(),
      },
      create: {
        clerkId: data.clerkId,
        email: data.email,
        name: data.name ?? null,
        imageUrl: data.imageUrl ?? null,
      },
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function createUser(data: {
  clerkId: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
}) {
  const db = await getDb();
  try {
    return await db.user.create({ data });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteUserByClerkId(clerkId: string) {
  const db = await getDb();
  try {
    return await db.user.deleteMany({ where: { clerkId } });
  } catch (error) {
    mapPrismaError(error);
  }
}

// ─── DB Service: Bookmarks ──────────────────────────────────────────

export async function findBookmarks(userId: string, type?: string | null) {
  const db = await getDb();
  try {
    return await db.bookmark.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function upsertBookmark(data: {
  userId: string;
  type: string;
  itemId: string;
  title: string;
  thumbnail?: string | null;
}) {
  const db = await getDb();
  try {
    return await db.bookmark.upsert({
      where: {
        userId_type_itemId: {
          userId: data.userId,
          type: data.type,
          itemId: data.itemId,
        },
      },
      update: {
        title: data.title,
        thumbnail: data.thumbnail,
      },
      create: data,
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteBookmark(userId: string, type: string, itemId: string) {
  const db = await getDb();
  try {
    return await db.bookmark.deleteMany({
      where: { userId, type, itemId },
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

// ─── DB Service: History ────────────────────────────────────────────

export async function findHistory(userId: string, type?: string | null, limit: number = 50) {
  const db = await getDb();
  try {
    return await db.history.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function upsertHistory(data: {
  userId: string;
  type: string;
  itemId: string;
  title: string;
  thumbnail?: string | null;
  progress: string;
  progressTitle?: string | null;
}) {
  const db = await getDb();
  try {
    return await db.history.upsert({
      where: {
        userId_type_itemId: {
          userId: data.userId,
          type: data.type,
          itemId: data.itemId,
        },
      },
      update: {
        title: data.title,
        thumbnail: data.thumbnail,
        progress: data.progress,
        progressTitle: data.progressTitle,
        updatedAt: new Date(),
      },
      create: data,
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteHistory(userId: string, type?: string | null, itemId?: string | null) {
  const db = await getDb();
  try {
    return await db.history.deleteMany({
      where: {
        userId,
        ...(type ? { type } : {}),
        ...(itemId ? { itemId } : {}),
      },
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

// ─── DB Service: Anime Cache ────────────────────────────────────────

/**
 * Find a cached anime by urlId, optionally enforcing a max age (in seconds).
 * Returns null if not found or if the cache is stale.
 */
export async function findCachedAnime(urlId: string, maxAgeSeconds?: number) {
  const db = await getDb();
  try {
    const anime = await db.anime.findUnique({ where: { urlId } });
    if (!anime) return null;

    // Check staleness if maxAge is specified
    if (maxAgeSeconds != null) {
      const age = (Date.now() - anime.lastScraped.getTime()) / 1000;
      if (age > maxAgeSeconds) return null;
    }

    return anime;
  } catch (error) {
    mapPrismaError(error);
  }
}

/**
 * Upsert an anime record in the cache table.
 * Uses urlId as the unique key.
 */
export async function upsertCachedAnime(data: {
  urlId: string;
  title: string;
  cover: string;
  alternativeTitle?: string | null;
  synopsis?: string | null;
  status?: string | null;
  type?: string | null;
  totalEpisodes?: number | null;
  rating?: number | null;
  genres?: unknown;
  episodes?: unknown;
  lastEpisode?: string | null;
  lastUpdate?: string | null;
  sourceUrl?: string | null;
}) {
  const db = await getDb();
  try {
    return await db.anime.upsert({
      where: { urlId: data.urlId },
      update: {
        title: data.title,
        cover: data.cover,
        alternativeTitle: data.alternativeTitle ?? null,
        synopsis: data.synopsis ?? null,
        status: data.status ?? null,
        type: data.type ?? null,
        totalEpisodes: data.totalEpisodes ?? null,
        rating: data.rating ?? null,
        genres: data.genres ?? undefined,
        episodes: data.episodes ?? undefined,
        lastEpisode: data.lastEpisode ?? null,
        lastUpdate: data.lastUpdate ?? null,
        sourceUrl: data.sourceUrl ?? null,
        lastScraped: new Date(),
      },
      create: {
        urlId: data.urlId,
        title: data.title,
        cover: data.cover,
        alternativeTitle: data.alternativeTitle ?? null,
        synopsis: data.synopsis ?? null,
        status: data.status ?? null,
        type: data.type ?? null,
        totalEpisodes: data.totalEpisodes ?? null,
        rating: data.rating ?? null,
        genres: data.genres ?? undefined,
        episodes: data.episodes ?? undefined,
        lastEpisode: data.lastEpisode ?? null,
        lastUpdate: data.lastUpdate ?? null,
        sourceUrl: data.sourceUrl ?? null,
        lastScraped: new Date(),
      },
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

// ─── DB Service: Komik Cache ────────────────────────────────────────

/**
 * Find a cached komik by mangaId, optionally enforcing a max age (in seconds).
 * Returns null if not found or if the cache is stale.
 */
export async function findCachedKomik(mangaId: string, maxAgeSeconds?: number) {
  const db = await getDb();
  try {
    const komik = await db.komik.findUnique({ where: { mangaId } });
    if (!komik) return null;

    // Check staleness if maxAge is specified
    if (maxAgeSeconds != null) {
      const age = (Date.now() - komik.lastScraped.getTime()) / 1000;
      if (age > maxAgeSeconds) return null;
    }

    return komik;
  } catch (error) {
    mapPrismaError(error);
  }
}

/**
 * Upsert a komik record in the cache table.
 * Uses mangaId as the unique key.
 */
export async function upsertCachedKomik(data: {
  mangaId: string;
  title: string;
  coverImage: string;
  alternativeTitle?: string | null;
  coverPortrait?: string | null;
  synopsis?: string | null;
  status?: number | null;
  type?: string | null;
  releaseYear?: string | null;
  country?: string | null;
  rating?: number | null;
  viewCount?: bigint | null;
  bookmarkCount?: number | null;
  genres?: unknown;
  authors?: unknown;
  artists?: unknown;
  latestChapterId?: string | null;
  latestChapterNumber?: number | null;
  latestChapterDate?: Date | null;
  chapters?: unknown;
  sourceUrl?: string | null;
}) {
  const db = await getDb();
  try {
    return await db.komik.upsert({
      where: { mangaId: data.mangaId },
      update: {
        title: data.title,
        coverImage: data.coverImage,
        alternativeTitle: data.alternativeTitle ?? null,
        coverPortrait: data.coverPortrait ?? null,
        synopsis: data.synopsis ?? null,
        status: data.status ?? null,
        type: data.type ?? null,
        releaseYear: data.releaseYear ?? null,
        country: data.country ?? null,
        rating: data.rating ?? null,
        viewCount: data.viewCount ?? null,
        bookmarkCount: data.bookmarkCount ?? null,
        genres: data.genres ?? undefined,
        authors: data.authors ?? undefined,
        artists: data.artists ?? undefined,
        latestChapterId: data.latestChapterId ?? null,
        latestChapterNumber: data.latestChapterNumber ?? null,
        latestChapterDate: data.latestChapterDate ?? null,
        chapters: data.chapters ?? undefined,
        sourceUrl: data.sourceUrl ?? null,
        lastScraped: new Date(),
      },
      create: {
        mangaId: data.mangaId,
        title: data.title,
        coverImage: data.coverImage,
        alternativeTitle: data.alternativeTitle ?? null,
        coverPortrait: data.coverPortrait ?? null,
        synopsis: data.synopsis ?? null,
        status: data.status ?? null,
        type: data.type ?? null,
        releaseYear: data.releaseYear ?? null,
        country: data.country ?? null,
        rating: data.rating ?? null,
        viewCount: data.viewCount ?? null,
        bookmarkCount: data.bookmarkCount ?? null,
        genres: data.genres ?? undefined,
        authors: data.authors ?? undefined,
        artists: data.artists ?? undefined,
        latestChapterId: data.latestChapterId ?? null,
        latestChapterNumber: data.latestChapterNumber ?? null,
        latestChapterDate: data.latestChapterDate ?? null,
        chapters: data.chapters ?? undefined,
        sourceUrl: data.sourceUrl ?? null,
        lastScraped: new Date(),
      },
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

// ─── DB Service: Batch Genre Fetch ──────────────────────────────────

/**
 * Fetch genres for multiple komik items by their mangaIds.
 * Returns a Map of mangaId -> string[] (genres).
 * Items not found in DB cache will not be in the returned map.
 */
export async function getKomikGenresBatch(mangaIds: string[]): Promise<Map<string, string[]>> {
  if (mangaIds.length === 0) return new Map();

  const db = await getDb();
  try {
    const records = await db.komik.findMany({
      where: { mangaId: { in: mangaIds } },
      select: { mangaId: true, genres: true },
    });

    const result = new Map<string, string[]>();
    for (const record of records) {
      const genres = Array.isArray(record.genres) ? (record.genres as string[]) : [];
      if (genres.length > 0) {
        result.set(record.mangaId, genres);
      }
    }
    return result;
  } catch (error) {
    mapPrismaError(error);
  }
}

/**
 * Fetch genres for multiple anime items by their urlIds.
 * Returns a Map of urlId -> string[] (genres).
 * Items not found in DB cache will not be in the returned map.
 */
export async function getAnimeGenresBatch(urlIds: string[]): Promise<Map<string, string[]>> {
  if (urlIds.length === 0) return new Map();

  const db = await getDb();
  try {
    const records = await db.anime.findMany({
      where: { urlId: { in: urlIds } },
      select: { urlId: true, genres: true },
    });

    const result = new Map<string, string[]>();
    for (const record of records) {
      const genres = Array.isArray(record.genres) ? (record.genres as string[]) : [];
      if (genres.length > 0) {
        result.set(record.urlId, genres);
      }
    }
    return result;
  } catch (error) {
    mapPrismaError(error);
  }
}

// ─── DB Service: SyncLog ────────────────────────────────────────────

/**
 * Create a new sync log entry (status = "running").
 */
export async function createSyncLog(type: string) {
  const db = await getDb();
  try {
    return await db.syncLog.create({
      data: {
        type,
        status: "running",
        startedAt: new Date(),
      },
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

/**
 * Complete a sync log entry with final status.
 */
export async function completeSyncLog(
  id: string,
  status: "success" | "error",
  itemsCount: number,
  errorMsg?: string | null
) {
  const db = await getDb();
  try {
    const log = await db.syncLog.findUnique({ where: { id } });
    const duration = log ? Math.round((Date.now() - log.startedAt.getTime()) / 1000) : null;

    return await db.syncLog.update({
      where: { id },
      data: {
        status,
        itemsCount,
        errorMsg: errorMsg ?? null,
        completedAt: new Date(),
        duration,
      },
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

/**
 * Get the latest sync log entry for a given type.
 */
export async function getLatestSyncLog(type: string) {
  const db = await getDb();
  try {
    return await db.syncLog.findFirst({
      where: { type },
      orderBy: { startedAt: "desc" },
    });
  } catch (error) {
    mapPrismaError(error);
  }
}
