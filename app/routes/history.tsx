import { Form, Link } from "react-router";
import type { Route } from "./+types/history";
import { prisma } from "~/lib/db.server";
import { getAuth } from "~/lib/auth.server";

const LIMIT = 20;

export function meta() {
  return [{ title: "History — KomikStream" }];
}

export async function loader(args: Route.LoaderArgs) {
  const auth = await getAuth(args).catch(() => null);
  if (!auth?.userId) return { items: [], total: 0, page: 1 };
  const page = Math.max(
    1,
    Number(new URL(args.request.url).searchParams.get("page") ?? "1") || 1,
  );
  const where = { userId: auth.userId, contentType: "komik" };
  const [items, total] = await Promise.all([
    prisma.history.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    prisma.history.count({ where }),
  ]);
  return { items, total, page };
}

export async function action(args: Route.ActionArgs) {
  const auth = await getAuth(args).catch(() => null);
  if (!auth?.userId) return { ok: false };
  const form = await args.request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "clear") {
    await prisma.history.deleteMany({ where: { userId: auth.userId } });
    return { ok: true };
  }
  const contentId = String(form.get("contentId") ?? "");
  if (!contentId) return { ok: false };
  await prisma.history.deleteMany({
    where: { userId: auth.userId, contentId, contentType: "komik" },
  });
  return { ok: true };
}

export default function HistoryPage({ loaderData }: Route.ComponentProps) {
  const { items, total, page } = loaderData;

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">History</h1>
        <p className="text-gray-400">No reading history yet.</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">History ({total})</h1>
        <Form method="post">
          <input type="hidden" name="intent" value="clear" />
          <button className="text-sm text-red-400 hover:text-red-300">
            Clear all
          </button>
        </Form>
      </div>
      <div className="space-y-2">
        {items.map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between bg-neutral-900 rounded p-3"
          >
            <Link
              to={`/komik/${h.contentId}`}
              className="hover:text-blue-400 truncate"
            >
              {h.contentId} — page {h.lastPage}
            </Link>
            <Form method="post">
              <input type="hidden" name="contentId" value={h.contentId} />
              <button
                aria-label={`Delete history ${h.contentId}`}
                className="text-sm text-red-400 hover:text-red-300 shrink-0 ml-2"
              >
                Delete
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
