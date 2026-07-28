import type { Route } from "./+types/manga._index";
import MangaCard, { getCover, getLatestChapter } from "~/components/MangaCard";
import { prisma } from "~/lib/db.server";

export function meta() {
  return [{ title: "Manga — KomikStream" }];
}

export async function loader(_args: Route.LoaderArgs) {
  const manga = await prisma.komik.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      komikChapters: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { chapterId: true },
      },
    },
  });
  return { manga };
}

export default function MangaIndex({ loaderData }: Route.ComponentProps) {
  const { manga } = loaderData;
  return (
    <div className="ks-container py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-soft">Katalog</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Jelajahi manga</h1>
        </div>
        <span className="text-sm text-white/40">{manga.length} judul</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {manga.map((item) => (
          <MangaCard
            key={item.id}
            slug={item.slug}
            title={item.title}
            cover={getCover(item.chapters)}
            latestChapter={getLatestChapter(item.chapters) ?? item.komikChapters[0]?.chapterId}
          />
        ))}
      </div>
      {manga.length === 0 && (
        <p className="ks-surface rounded-2xl py-16 text-center text-white/50">Belum ada manga.</p>
      )}
    </div>
  );
}
/* ponytail: pagination waits until catalog volume requires server pagination. */
