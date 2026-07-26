import { Link } from "react-router";
import type { Route } from "./+types/manga._index";
import { prisma } from "~/lib/db.server";

export function meta() {
  return [{ title: "Manga — KomikStream" }];
}

export async function loader(_args: Route.LoaderArgs) {
  const manga = await prisma.komik.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return { manga };
}

export default function MangaIndex({ loaderData }: Route.ComponentProps) {
  const { manga } = loaderData;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Manga</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {manga.map((m) => {
          const cover = (m.chapters as { cover?: string }[] | null)?.[0]
            ?.cover;
          return (
            <Link
              key={m.id}
              to={`/manga/${m.slug}`}
              className="group rounded-lg border p-3 transition hover:shadow-lg"
            >
              {cover && (
                <div className="mb-2 aspect-[3/4] overflow-hidden rounded">
                  <img
                    src={cover}
                    alt={m.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <h2 className="line-clamp-2 text-sm font-medium">{m.title}</h2>
            </Link>
          );
        })}
      </div>
      {manga.length === 0 && (
        <p className="py-12 text-center text-gray-500">Belum ada manga.</p>
      )}
    </div>
  );
}
