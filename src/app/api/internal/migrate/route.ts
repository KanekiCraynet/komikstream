import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY endpoint to run schema migration on Azure PostgreSQL.
 * Remove after first successful run.
 *
 * POST /api/internal/migrate
 * Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (
    !expectedToken ||
    !authHeader?.startsWith("Bearer ") ||
    authHeader.slice(7) !== expectedToken
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getSafePrisma } = await import("@/lib/prisma");
    const prisma = await getSafePrisma();

    if (!prisma) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Check which tables already exist
    const existing = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    const existingTables = new Set(existing.map((t) => t.table_name));

    const results: string[] = [];

    // Create tables if they don't exist
    if (!existingTables.has("User")) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "User" (
          "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
          "clerkId" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "name" TEXT,
          "imageUrl" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId")`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`);
      results.push("Created User table");
    } else {
      results.push("User table exists");
    }

    if (!existingTables.has("Bookmark")) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "Bookmark" (
          "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "itemId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "thumbnail" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX "Bookmark_userId_idx" ON "Bookmark"("userId")`);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX "Bookmark_userId_type_itemId_key" ON "Bookmark"("userId", "type", "itemId")`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
      );
      results.push("Created Bookmark table");
    } else {
      results.push("Bookmark table exists");
    }

    if (!existingTables.has("History")) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "History" (
          "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "itemId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "thumbnail" TEXT,
          "progress" TEXT NOT NULL,
          "progressTitle" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "History_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX "History_userId_idx" ON "History"("userId")`);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX "History_userId_type_itemId_key" ON "History"("userId", "type", "itemId")`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
      );
      results.push("Created History table");
    } else {
      results.push("History table exists");
    }

    if (!existingTables.has("Anime")) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "Anime" (
          "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
          "urlId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "alternativeTitle" TEXT,
          "cover" TEXT NOT NULL,
          "synopsis" TEXT,
          "status" TEXT,
          "type" TEXT,
          "totalEpisodes" INTEGER,
          "rating" DOUBLE PRECISION,
          "genres" JSONB,
          "episodes" JSONB,
          "lastEpisode" TEXT,
          "lastUpdate" TEXT,
          "sourceUrl" TEXT,
          "lastScraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Anime_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Anime_urlId_key" ON "Anime"("urlId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "Anime_urlId_idx" ON "Anime"("urlId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "Anime_title_idx" ON "Anime"("title")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "Anime_createdAt_idx" ON "Anime"("createdAt")`);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "Anime_lastScraped_idx" ON "Anime"("lastScraped")`
      );
      results.push("Created Anime table");
    } else {
      results.push("Anime table exists");
    }

    if (!existingTables.has("Komik")) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "Komik" (
          "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
          "mangaId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "alternativeTitle" TEXT,
          "coverImage" TEXT NOT NULL,
          "coverPortrait" TEXT,
          "synopsis" TEXT,
          "status" INTEGER,
          "type" TEXT,
          "releaseYear" TEXT,
          "country" TEXT,
          "rating" DOUBLE PRECISION,
          "viewCount" BIGINT,
          "bookmarkCount" INTEGER,
          "genres" JSONB,
          "authors" JSONB,
          "artists" JSONB,
          "latestChapterId" TEXT,
          "latestChapterNumber" DOUBLE PRECISION,
          "latestChapterDate" TIMESTAMP(3),
          "chapters" JSONB,
          "sourceUrl" TEXT,
          "lastScraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Komik_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX "Komik_mangaId_key" ON "Komik"("mangaId")`
      );
      await prisma.$executeRawUnsafe(`CREATE INDEX "Komik_mangaId_idx" ON "Komik"("mangaId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "Komik_title_idx" ON "Komik"("title")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "Komik_type_idx" ON "Komik"("type")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "Komik_createdAt_idx" ON "Komik"("createdAt")`);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "Komik_lastScraped_idx" ON "Komik"("lastScraped")`
      );
      results.push("Created Komik table");
    } else {
      results.push("Komik table exists");
    }

    if (!existingTables.has("SyncLog")) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "SyncLog" (
          "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
          "type" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "itemsCount" INTEGER NOT NULL DEFAULT 0,
          "errorMsg" TEXT,
          "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP(3),
          "duration" INTEGER,
          CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX "SyncLog_type_idx" ON "SyncLog"("type")`);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX "SyncLog_startedAt_idx" ON "SyncLog"("startedAt")`
      );
      results.push("Created SyncLog table");
    } else {
      results.push("SyncLog table exists");
    }

    // Cleanup: delete Komik entries where mangaId is a full URL (corrupted by old slug extraction bug)
    if (existingTables.has("Komik")) {
      const deleted = await prisma.$executeRawUnsafe(
        `DELETE FROM "Komik" WHERE "mangaId" LIKE 'http%'`
      );
      results.push(`Cleaned ${deleted} corrupted Komik entries (mangaId containing URLs)`);
    }

    logger.info("Migration completed", { results });
    return NextResponse.json({ success: true, results });
  } catch (error) {
    logger.error("Migration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Migration failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
