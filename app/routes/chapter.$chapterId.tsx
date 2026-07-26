import type { Route } from "./+types/chapter.$chapterId";
import MangaReader from "~/components/MangaReader";
import { prisma } from "~/lib/db.server";
import { parseImages } from "~/lib/manga.server";

export async function loader({ params }: Route.LoaderArgs) {
  const chapter = await prisma.komikChapter.findUnique({
    where: { chapterId: params.chapterId },
  });
  if (!chapter) throw new Response("Not found", { status: 404 });
  return { chapterId: chapter.chapterId, images: parseImages(chapter.images) };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data ? `${data.chapterId} | Komikstream` : "Not found" }];
}

export default function ChapterPage({ loaderData }: Route.ComponentProps) {
  return (
    <MangaReader
      chapterId={loaderData.chapterId}
      images={loaderData.images}
      tier="free"
      initialPage={null}
      authenticated={false}
    />
  );
}
