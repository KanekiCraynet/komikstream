import type { Route } from "./+types/chapter.$chapterId";
import MangaReader from "~/components/MangaReader";
import { prisma } from "~/lib/db.server";
import { getCurrentUserId } from "~/lib/auth.server";
import { parseImages } from "~/lib/manga.server";
import { getSubscriptionStatus } from "~/lib/subscription.server";

export async function loader(args: Route.LoaderArgs) {
  const chapter = await prisma.komikChapter.findUnique({
    where: { chapterId: args.params.chapterId },
  });
  if (!chapter) throw new Response("Not found", { status: 404 });

  let authenticated = false;
  let tier: "free" | "premium" = "free";
  let initialPage: number | null = null;

  const userId = await getCurrentUserId(args);
  if (userId) {
    authenticated = true;
    const [sub, history] = await Promise.all([
      getSubscriptionStatus(userId),
      prisma.history.findUnique({
        where: {
          userId_contentId_contentType: {
            userId,
            contentId: chapter.chapterId,
            contentType: "komik",
          },
        },
        select: { lastPage: true },
      }),
    ]);
    tier = sub.tier;
    initialPage = history?.lastPage ?? null;
  }

  return {
    chapterId: chapter.chapterId,
    images: parseImages(chapter.images),
    tier,
    initialPage,
    authenticated,
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data ? `${data.chapterId} | Komikstream` : "Not found" }];
}

export default function ChapterPage({ loaderData }: Route.ComponentProps) {
  return (
    <MangaReader
      chapterId={loaderData.chapterId}
      images={loaderData.images}
      tier={loaderData.tier}
      initialPage={loaderData.initialPage}
      authenticated={loaderData.authenticated}
    />
  );
}
