import pg from "pg";

type LatestChapter = { title: string; slug: string; date?: string };
type LatestItem = {
  title: string;
  slug: string;
  image?: string;
  type?: string;
  color?: string;
  chapters?: LatestChapter[];
};
type LatestResponse = { success: boolean; komikList: LatestItem[] };

type DetailChapter = { title?: string; slug: string; releaseTime?: string };
type DetailResponse = {
  success: boolean;
  data: {
    title: string;
    image?: string;
    rating?: string;
    detail?: {
      alternativeTitle?: string;
      status?: string;
      type?: string;
      author?: string;
      illustrator?: string;
      theme?: string | null;
    };
    genres?: { name: string; slug: string }[];
    description?: string;
    chapters?: DetailChapter[];
  };
};

type ChapterResponse = {
  success: boolean;
  data: {
    title: string;
    images: { id: number; url: string }[];
    navigation?: { next?: string | null; prev?: string | null };
  };
};

const source = "https://www.sankavollerei.web.id/comic/komikindo";
const featuredSlug = "rise-of-the-mushroom-king";
const featuredChapter = "rise-of-the-mushroom-king-chapter-20";
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

function cleanTitle(value: string) {
  return value.replace(/^Komik\s+/i, "").replace(/\s+/g, " ").trim();
}

async function main() {
  const [latest, detail, chapter] = await Promise.all([
    fetchJson<LatestResponse>(`${source}/latest/1`),
    fetchJson<DetailResponse>(`${source}/detail/${featuredSlug}`),
    fetchJson<ChapterResponse>(`${source}/chapter/${featuredChapter}`),
  ]);
  if (!latest.success || !detail.success || !chapter.success) {
    throw new Error("Sanka Komikindo returned an unsuccessful response");
  }

  await client.connect();

  for (const item of latest.komikList) {
    const id = idFor(item.slug);
    const chapters = JSON.stringify([
      {
        chapterId: item.chapters?.[0]?.slug ?? null,
        title: item.chapters?.[0]?.title ?? "Latest chapter",
        date: item.chapters?.[0]?.date ?? null,
        source: "komikindo",
        type: item.type ?? null,
        color: item.color ?? null,
        cover: item.image ?? null,
      },
    ]);
    await client.query(
      `INSERT INTO "Komik" (id, slug, title, genres, chapters, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, now(), now())
       ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title,
         genres = EXCLUDED.genres, chapters = EXCLUDED.chapters, "updatedAt" = now()`,
      [
        id,
        item.slug,
        cleanTitle(item.title),
        JSON.stringify(item.type ? [item.type] : []),
        chapters,
      ],
    );
  }

  const featuredId = idFor(featuredSlug);
  const featuredChapters = detail.data.chapters ?? [];
  const metadata = [
    {
      chapterId: featuredChapters[0]?.slug ?? null,
      title: featuredChapters[0]?.title ?? "Latest chapter",
      date: featuredChapters[0]?.releaseTime ?? null,
      source: "komikindo",
      cover: detail.data.image ?? null,
      rating: detail.data.rating ?? null,
      status: detail.data.detail?.status ?? null,
      type: detail.data.detail?.type ?? null,
      author: detail.data.detail?.author ?? null,
      artist: detail.data.detail?.illustrator ?? null,
      synopsis: detail.data.description ?? null,
      otherTitle: detail.data.detail?.alternativeTitle ?? null,
      genres: detail.data.genres ?? [],
      chapters: featuredChapters,
    },
  ];
  await client.query(
    `INSERT INTO "Komik" (id, slug, title, genres, chapters, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, now(), now())
     ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title,
       genres = EXCLUDED.genres, chapters = EXCLUDED.chapters, "updatedAt" = now()`,
    [
      featuredId,
      featuredSlug,
      cleanTitle(detail.data.title),
      JSON.stringify(detail.data.genres ?? []),
      JSON.stringify(metadata),
    ],
  );

  for (const [index, item] of featuredChapters.entries()) {
    const images = item.slug === featuredChapter ? chapter.data.images : [];
    await client.query(
      `INSERT INTO "KomikChapter" (id, "komikId", "chapterId", images, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4::jsonb, now() - ($5 * interval '1 second'), now())
       ON CONFLICT ("chapterId") DO UPDATE SET images = EXCLUDED.images,
         "updatedAt" = now(), "komikId" = EXCLUDED."komikId"`,
      [
        `${featuredId}-${item.slug}`,
        featuredId,
        item.slug,
        JSON.stringify(images),
        index,
      ],
    );
  }

  console.log(
    `seeded: ${latest.komikList.length} Komikindo latest titles + ${cleanTitle(detail.data.title)} (${featuredChapters.length} chapters, chapter 20 has ${chapter.data.images.length} images)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
