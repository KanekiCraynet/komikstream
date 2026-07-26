import { Link } from "react-router";
import type { Route } from "./+types/manga.$slug";
import { prisma } from "~/lib/db.server";

export async function loader({ params }: Route.LoaderArgs) {
  const manga = await prisma.komik.findUnique({ where: { slug: params.slug } });
  if (!manga) throw new Response("Not found", { status: 404 });
  const chapters = await prisma.komikChapter.findMany({
    where: { komikId: manga.id },
    orderBy: { createdAt: "desc" },
  });
  return { manga, chapters };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data ? `${data.manga.title} | Komikstream` : "Not found" }];
}

export default function MangaPage({ loaderData }: Route.ComponentProps) {
  const { manga, chapters } = loaderData;
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">{manga.title}</h1>
      {chapters.length ? (
        <ul className="divide-y">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Link className="block px-4 py-3" to={`/chapter/${chapter.chapterId}`}>
                {chapter.chapterId.replaceAll("-", " ")}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>Belum ada chapter.</p>
      )}
    </main>
  );
}
