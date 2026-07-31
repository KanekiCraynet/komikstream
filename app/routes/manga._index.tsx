import type { Route } from "./+types/manga._index";
import MangaCard, { getCover, getLatestChapter } from "~/components/MangaCard";
import { prisma } from "~/lib/db.server";
import { listGenres } from "~/lib/genres.server";
import { hasGenre } from "~/lib/manga-types";

export function meta() {
  return [{ title: "Manga — KomikStream" }];
}

export async function loader(args: Route.LoaderArgs) {
  const genreSlug = args.request.url ? new URL(args.request.url).searchParams.get("genre") : null;
  const manga = await prisma.komik.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      komikChapters: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { chapterId: true },
      },
    },
  });
  const genres = await listGenres();
  return { manga, genreSlug, genres };
}

export default function MangaIndex({ loaderData }: Route.ComponentProps) {
  const { manga, genreSlug, genres } = loaderData;
  const genreLabel = genreSlug ? genres.find((g) => g.slug === genreSlug)?.name ?? genreSlug : null;
  const filtered = genreSlug ? manga.filter((item) => hasGenre(item, genreSlug)) : manga;
  return (
    <div className="ks-container py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-soft">Katalog</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {genreLabel ? `Genre: ${genreLabel}` : "Jelajahi manga"}
          </h1>
        </div>
        <span className="text-sm text-white/40">{filtered.length} judul</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((item) => (
          <MangaCard
            key={item.id}
            slug={item.slug}
            title={item.title}
            cover={getCover(item.chapters)}
            latestChapter={getLatestChapter(item.chapters) ?? item.komikChapters[0]?.chapterId}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="ks-surface rounded-2xl py-16 text-center text-white/50">
          {genreLabel ? `Tidak ada manga dengan genre "${genreLabel}".` : "Belum ada manga."}
        </p>
      )}
    </div>
  );
}
/* ponytail: pagination waits until catalog volume requires server pagination. */
