import { data } from "react-router";
import type { Route } from "./+types/api.history";
import { prisma } from "~/lib/db.server";
import { getAuth } from "~/lib/auth.server";

export async function action(args: Route.ActionArgs) {
  const { request } = args;
  const user = await getAuth(args).catch(() => null);
  if (!user?.userId) return data({ ok: false }, { status: 401 });

  const { contentId, lastPage } = await request.json();
  if (!contentId || typeof lastPage !== "number") {
    return data({ ok: false }, { status: 400 });
  }

  await prisma.history.upsert({
    where: {
      userId_contentId_contentType: {
        userId: user.userId,
        contentId,
        contentType: "komik",
      },
    },
    create: { userId: user.userId, contentId, contentType: "komik", lastPage },
    update: { lastPage },
  });

  return { ok: true };
}
