import { data } from "react-router";
import type { Route } from "./+types/api.history";
import { prisma } from "~/lib/db.server";
import { getCurrentUserId } from "~/lib/auth.server";
import { requireSameOrigin } from "~/lib/csrf.server";

export async function action(args: Route.ActionArgs) {
  const { request } = args;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const userId = await getCurrentUserId(args);
  if (!userId) return data({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => null);
  const contentId = body && typeof body === "object" && "contentId" in body
    ? body.contentId
    : null;
  const lastPage = body && typeof body === "object" && "lastPage" in body
    ? body.lastPage
    : null;
  if (
    typeof contentId !== "string" ||
    contentId.length === 0 ||
    !Number.isSafeInteger(lastPage) ||
    lastPage < 0
  ) {
    return data({ ok: false }, { status: 400 });
  }

  await prisma.history.upsert({
    where: {
      userId_contentId_contentType: {
        userId,
        contentId,
        contentType: "komik",
      },
    },
    create: { userId, contentId, contentType: "komik", lastPage },
    update: { lastPage },
  });

  return { ok: true };
}
