import { Form, Link } from "react-router";
import type { Route } from "./+types/bookmark";
import { prisma } from "~/lib/db.server";
import { getCurrentUserId } from "~/lib/auth.server";
import { requireSameOrigin } from "~/lib/csrf.server";

const LIMIT = 20;

export function meta() {
  return [{ title: "Bookmarks — KomikStream" }];
}

export async function loader(args: Route.LoaderArgs) {
  const userId = await getCurrentUserId(args);
  if (!userId) return { items: [], total: 0, page: 1 };
  const page = Math.max(
    1,
    Number(new URL(args.request.url).searchParams.get("page") ?? "1") || 1,
  );
  const where = { userId, contentType: "komik" };
  const [items, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    prisma.bookmark.count({ where }),
  ]);
  return { items, total, page };
}

export async function action(args: Route.ActionArgs) {
  const originError = requireSameOrigin(args.request);
  if (originError) return originError;
  const userId = await getCurrentUserId(args);
  if (!userId) return { ok: false };
  const form = await args.request.formData();
  const contentId = String(form.get("contentId") ?? "");
  if (!contentId) return { ok: false };
  await prisma.bookmark.deleteMany({
    where: { userId, contentId, contentType: "komik" },
  });
  return { ok: true };
}

export default function BookmarkPage({ loaderData }: Route.ComponentProps) {
  const { items, total, page } = loaderData;

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">Bookmarks</h1>
        <p className="text-gray-400">No bookmarks yet.</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Bookmarks ({total})</h1>
      <div className="space-y-2">
        {items.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between bg-neutral-900 rounded p-3"
          >
            <Link
              to={`/komik/${b.contentId}`}
              className="hover:text-blue-400 truncate"
            >
              {b.contentId}
            </Link>
            <Form method="post">
              <input type="hidden" name="contentId" value={b.contentId} />
              <button
                aria-label={`Remove bookmark ${b.contentId}`}
                className="text-sm text-red-400 hover:text-red-300 shrink-0 ml-2"
              >
                Remove
              </button>
            </Form>
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-center mt-4">
        <Link
          to={`?page=${page - 1}`}
          aria-disabled={page <= 1}
          className={`px-3 py-1 bg-neutral-800 rounded ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          Prev
        </Link>
        <Link
          to={`?page=${page + 1}`}
          aria-disabled={page * LIMIT >= total}
          className={`px-3 py-1 bg-neutral-800 rounded ${page * LIMIT >= total ? "pointer-events-none opacity-40" : ""}`}
        >
          Next
        </Link>
      </div>
    </main>
  );
}
