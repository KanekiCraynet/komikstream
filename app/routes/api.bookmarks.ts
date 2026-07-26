import type { Route } from "./+types/api.bookmarks";
import { prisma } from "~/lib/db.server";
import { getCurrentUserId } from "~/lib/auth.server";

export async function loader(args: Route.LoaderArgs) {
  const userId = await getCurrentUserId(args);
  if (!userId) return { items: [], total: 0 };

  const rawPage = Number(
    new URL(args.request.url).searchParams.get("page") ?? "1",
  );
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = 20;
  const where = { userId, contentType: "komik" };
  const [items, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bookmark.count({ where }),
  ]);
  return { items, total };
}

export async function action(args: Route.ActionArgs) {
  const userId = await getCurrentUserId(args);
  if (!userId) return { bookmarked: false };

  const body = (await args.request.json().catch(() => null)) as {
    contentId?: unknown;
  } | null;
  if (typeof body?.contentId !== "string" || !body.contentId) {
    return Response.json({ error: "INVALID_CONTENT_ID" }, { status: 400 });
  }
  const contentId = body.contentId;

  const existing = await prisma.bookmark.findUnique({
    where: {
      userId_contentId_contentType: { userId, contentId, contentType: "komik" },
    },
    select: { id: true },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }
  await prisma.bookmark.create({
    data: { userId, contentId, contentType: "komik" },
  });
  return { bookmarked: true };
}
