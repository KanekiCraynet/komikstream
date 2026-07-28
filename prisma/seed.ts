import pg from "pg";

type LatestItem = {
  title: string;
  slug: string;
  cover?: string;
  chapter?: string;
  date?: string;
  type?: string;
};

type DetailChapter = { title?: string; slug: string; date?: string };
type LatestResponse = { success: boolean; komikList: LatestItem[] };
type DetailResponse = {
  success: boolean;
  detail: {
    title: string;
    cover?: string;
    rating?: string;
    otherTitle?: string;
    status?: string;
    type?: string;
    author?: string;
    artist?: string;
    release?: string;
    synopsis?: string;
    genres?: { title: string; slug: string }[];
    chapters?: DetailChapter[];
  };
};
type ChapterResponse = {
  success: boolean;
  title: string;
  images: string[];
  navigation?: { next?: string | null; prev?: string | null };
};

const source = "https://www.sankavollerei.web.id/comic/bacakomik";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "user-agent": "KomikStream development seed" },
  });
  if (!response.ok) throw new Error(`Sanka ${response.status}: ${url}`);
  return response.json() as Promise<T>;
}

function idFor(slug: string) {
  return `sanka-${slug.replace(/[^a-z0-9-]/gi, "-").slice(0, 180)}`;
}

async function main() {
  const [latest, detail, chapter] = await Promise.all([
    fetchJson<LatestResponse>(`${source}/latest`),
    fetchJson<DetailResponse>(`${source}/detail/nano-machine`),
    fetchJson<ChapterResponse>(`${source}/chapter/nano-machine-chapter-1`),
  ]);
  if (!latest.success || !detail.success || !chapter.success) {
    throw new Error("Sanka returned an unsuccessful response");
  }

  await client.connect();
  await client.query(`DELETE FROM "Komik" WHERE slug = 'one-piece'`);

  for (const item of latest.komikList) {
    const id = idFor(item.slug);
    const chapters = JSON.stringify([
      {
        chapterId: item.chapter ?? null,
        title: item.chapter ?? "Latest chapter",
        date: item.date ?? null,
        source: "sanka",
        type: item.type ?? null,
        cover: item.cover ?? null,
      },
    ]);
    await client.query(
      `INSERT INTO "Komik" (id, slug, title, genres, chapters, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, now(), now())
       ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title,
         genres = EXCLUDED.genres, chapters = EXCLUDED.chapters, "updatedAt" = now()`,
      [id, item.slug, item.title, JSON.stringify(item.type ? [item.type] : []), chapters],
    );
  }

  const nanoId = idFor("nano-machine");
  const nanoChapters = detail.detail.chapters ?? [];
  const nanoMetadata = [
    {
      chapterId: nanoChapters[0]?.slug ?? null,
      title: nanoChapters[0]?.title || "Latest chapter",
      date: nanoChapters[0]?.date ?? null,
      source: "sanka",
      cover: detail.detail.cover ?? null,
      rating: detail.detail.rating ?? null,
      status: detail.detail.status ?? null,
      type: detail.detail.type ?? null,
      author: detail.detail.author ?? null,
      artist: detail.detail.artist ?? null,
      release: detail.detail.release ?? null,
      synopsis: detail.detail.synopsis ?? null,
      otherTitle: detail.detail.otherTitle?.replaceAll("�", "") ?? null,
      series: detail.detail.series ?? null,
      reader: detail.detail.reader ?? null,
      genres: detail.detail.genres ?? [],
      chapters: nanoChapters,
    },
  ];
  await client.query(
    `INSERT INTO "Komik" (id, slug, title, genres, chapters, "createdAt", "updatedAt")
     VALUES ($1, 'nano-machine', $2, $3::jsonb, $4::jsonb, now(), now())
     ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title,
       genres = EXCLUDED.genres, chapters = EXCLUDED.chapters, "updatedAt" = now()`,
    [nanoId, detail.detail.title, JSON.stringify(detail.detail.genres ?? []), JSON.stringify(nanoMetadata)],
  );
  for (const [index, item] of nanoChapters.entries()) {
    const images = item.slug === "nano-machine-chapter-1" ? chapter.images : [];
    await client.query(
      `INSERT INTO "KomikChapter" (id, "komikId", "chapterId", images, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4::jsonb, now() - ($5 * interval '1 second'), now())
       ON CONFLICT ("chapterId") DO UPDATE SET images = EXCLUDED.images, "updatedAt" = now(), "komikId" = EXCLUDED."komikId"`,
      [`${nanoId}-${item.slug}`, nanoId, item.slug, JSON.stringify(images), index],
    );
  }

  console.log(`seeded: ${latest.komikList.length} Sanka latest titles + Nano Machine (${nanoChapters.length} chapters, chapter 1 has ${chapter.images.length} images)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
