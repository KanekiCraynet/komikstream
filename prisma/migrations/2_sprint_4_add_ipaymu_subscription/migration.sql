-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'grace');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('ipaymu');

-- DropForeignKey
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_userId_fkey";

-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_userId_fkey";

-- DropIndex
DROP INDEX "Bookmark_userId_idx";

-- DropIndex
DROP INDEX "Bookmark_userId_type_itemId_key";

-- DropIndex
DROP INDEX "History_userId_idx";

-- DropIndex
DROP INDEX "History_userId_type_itemId_key";

-- DropIndex
DROP INDEX "Komik_mangaId_key";

-- DropIndex
DROP INDEX "Komik_mangaId_idx";

-- DropIndex
DROP INDEX "Komik_title_idx";

-- DropIndex
DROP INDEX "Komik_type_idx";

-- DropIndex
DROP INDEX "Komik_createdAt_idx";

-- DropIndex
DROP INDEX "Komik_lastScraped_idx";

-- DropIndex
DROP INDEX "KomikChapter_chapterId_idx";

-- DropIndex
DROP INDEX "KomikChapter_lastScraped_idx";

-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "itemId",
DROP COLUMN "thumbnail",
DROP COLUMN "title",
DROP COLUMN "type",
ADD COLUMN     "contentId" TEXT NOT NULL,
ADD COLUMN     "contentType" TEXT NOT NULL DEFAULT 'komik',
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "History" DROP COLUMN "itemId",
DROP COLUMN "progress",
DROP COLUMN "progressTitle",
DROP COLUMN "thumbnail",
DROP COLUMN "title",
DROP COLUMN "type",
ADD COLUMN     "contentId" TEXT NOT NULL,
ADD COLUMN     "contentType" TEXT NOT NULL DEFAULT 'komik',
ADD COLUMN     "lastPage" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "imageUrl",
DROP COLUMN "name",
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "preferences" JSONB,
ADD COLUMN     "tier" "Tier" NOT NULL DEFAULT 'free',
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Komik" DROP COLUMN "alternativeTitle",
DROP COLUMN "artists",
DROP COLUMN "authors",
DROP COLUMN "bookmarkCount",
DROP COLUMN "country",
DROP COLUMN "coverImage",
DROP COLUMN "coverPortrait",
DROP COLUMN "lastScraped",
DROP COLUMN "latestChapterDate",
DROP COLUMN "latestChapterId",
DROP COLUMN "latestChapterNumber",
DROP COLUMN "mangaId",
DROP COLUMN "rating",
DROP COLUMN "releaseYear",
DROP COLUMN "sourceUrl",
DROP COLUMN "status",
DROP COLUMN "synopsis",
DROP COLUMN "type",
DROP COLUMN "viewCount",
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "KomikChapter" DROP COLUMN "chapterTitle",
DROP COLUMN "lastScraped",
DROP COLUMN "mangaSlug",
DROP COLUMN "mangaTitle",
DROP COLUMN "nextChapter",
DROP COLUMN "prevChapter",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "komikId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "images" DROP NOT NULL;

-- DropTable
DROP TABLE "Anime";

-- DropTable
DROP TABLE "SyncLog";

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "provider" "PaymentProvider" NOT NULL,
    "externalId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "graceUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_externalId_key" ON "Subscription"("externalId");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_contentId_contentType_key" ON "Bookmark"("userId", "contentId", "contentType");

-- CreateIndex
CREATE INDEX "History_userId_updatedAt_idx" ON "History"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "History_userId_contentId_contentType_key" ON "History"("userId", "contentId", "contentType");

-- CreateIndex
CREATE UNIQUE INDEX "Komik_slug_key" ON "Komik"("slug");

-- CreateIndex
CREATE INDEX "KomikChapter_komikId_idx" ON "KomikChapter"("komikId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KomikChapter" ADD CONSTRAINT "KomikChapter_komikId_fkey" FOREIGN KEY ("komikId") REFERENCES "Komik"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
