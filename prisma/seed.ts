// Minimal seed for local E2E: one komik with one chapter. Raw pg — no Prisma
// client import (generated client uses extensionless ESM imports that plain
// node cannot resolve outside Vite).
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  await client.query(
    `INSERT INTO "Komik" (id, slug, title, genres, chapters, "createdAt", "updatedAt")
     VALUES ('seed-op', 'one-piece', 'One Piece',
             '["action","adventure"]'::jsonb,
             '[{"chapterId":"op-1","title":"Chapter 1"}]'::jsonb,
             now(), now())
     ON CONFLICT (slug) DO NOTHING`,
  );
  await client.query(
    `INSERT INTO "KomikChapter" (id, "komikId", "chapterId", images, "createdAt", "updatedAt")
     VALUES ('seed-op-1', 'seed-op', 'op-1',
             '["https://placehold.co/800x1200"]'::jsonb, now(), now())
     ON CONFLICT ("chapterId") DO NOTHING`,
  );
  console.log("seeded: one-piece + op-1");
}

main().finally(() => client.end());
