import { redirect } from "react-router";
import type { Route } from "./+types/komik.$id";
import { prisma } from "~/lib/db.server";

/**
 * Legacy resolver: /komik/:id where id may be a chapterId, komik id, or slug
 * (History/Bookmark store chapterIds as contentId; old Next app also linked
 * /komik/<mangaId>). Redirects to the canonical URL.
 */
export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;

  const chapter = await prisma.komikChapter.findUnique({
    where: { chapterId: id },
    select: { chapterId: true },
  });
  if (chapter) throw redirect(`/chapter/${chapter.chapterId}`);

  const manga = await prisma.komik.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { slug: true },
  });
  throw redirect(manga ? `/manga/${manga.slug}` : "/manga");
}
