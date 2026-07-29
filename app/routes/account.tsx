import { Form, redirect } from "react-router";
import type { Route } from "./+types/account";
import { prisma } from "~/lib/db.server";
import { getCurrentUserId } from "~/lib/auth.server";
import { paymentEnabled } from "~/lib/ipaymu.server";
import {
  cancelSubscription,
  getSubscriptionStatus,
} from "~/lib/subscription.server";
import { requireSameOrigin } from "~/lib/csrf.server";

export function meta() {
  return [{ title: "Account — KomikStream" }];
}

export async function loader(args: Route.LoaderArgs) {
  const userId = await getCurrentUserId(args);
  if (!userId) return { user: null, sub: null };

  const [user, sub] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, tier: true },
    }),
    paymentEnabled
      ? getSubscriptionStatus(userId)
      : Promise.resolve({ tier: "free" as const, subscription: null }),
  ]);
  return { user, sub };
}

export async function action(args: Route.ActionArgs) {
  const originError = requireSameOrigin(args.request);
  if (originError) return originError;
  const userId = await getCurrentUserId(args);
  if (!userId) return { ok: false };

  const form = await args.request.formData();
  const intent = String(form.get("intent") ?? "");

  if (intent === "cancel-subscription") {
    await cancelSubscription(userId);
    return { ok: true };
  }
  if (intent === "delete-account") {
    // Cascade: bookmarks + history via onDelete: Cascade in schema
    await prisma.user.delete({ where: { id: userId } });
    throw redirect("/");
  }
  return { ok: false };
}

export default function AccountPage({ loaderData }: Route.ComponentProps) {
  const { user, sub } = loaderData;

  if (!user) {
    return (
      <main className="max-w-xl mx-auto p-4">
        <h1 className="text-xl font-bold">Account</h1>
        <p className="text-gray-400 mt-2">Sign in to manage preferences.</p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">Account</h1>
      <p className="text-sm text-gray-400">Email: {user.email}</p>

      <section>
        <h2 className="text-lg font-semibold mb-2">Subscription</h2>
        <p className="text-sm text-gray-400">
          Tier:{" "}
          <span
            className={
              sub?.tier === "premium" ? "text-yellow-400 font-semibold" : ""
            }
          >
            {sub?.tier ?? "free"}
          </span>
        </p>
        {sub?.subscription?.endsAt && (
          <p className="text-xs text-gray-500">
            {sub.subscription.status === "grace"
              ? "Grace period until"
              : "Expires"}
            : {new Date(sub.subscription.endsAt).toLocaleDateString()}
          </p>
        )}
        {sub?.tier === "premium" && (
          <Form method="post" className="mt-2">
            <input type="hidden" name="intent" value="cancel-subscription" />
            <button className="text-sm text-red-400 hover:text-red-300">
              Cancel subscription
            </button>
          </Form>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Danger zone</h2>
        <Form
          method="post"
          onSubmit={(e) => {
            if (!confirm("Delete account? This removes bookmarks and history."))
              e.preventDefault();
          }}
        >
          <input type="hidden" name="intent" value="delete-account" />
          <button className="rounded border border-red-500 px-3 py-1 text-sm text-red-400 hover:bg-red-500/10">
            Delete account
          </button>
        </Form>
      </section>
    </main>
  );
}
