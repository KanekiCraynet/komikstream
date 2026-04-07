-- CreateTable
CREATE TABLE "KomikChapter" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "chapterId" TEXT NOT NULL,
    "mangaTitle" TEXT NOT NULL,
    "mangaSlug" TEXT NOT NULL,
    "chapterTitle" TEXT NOT NULL,
    "prevChapter" TEXT,
    "nextChapter" TEXT,
    "images" JSONB NOT NULL,
    "lastScraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KomikChapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KomikChapter_chapterId_key" ON "KomikChapter"("chapterId");

-- CreateIndex
CREATE INDEX "KomikChapter_chapterId_idx" ON "KomikChapter"("chapterId");

-- CreateIndex
CREATE INDEX "KomikChapter_lastScraped_idx" ON "KomikChapter"("lastScraped");
