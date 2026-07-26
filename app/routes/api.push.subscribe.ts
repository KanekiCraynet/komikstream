import type { Route } from "./+types/api.push.subscribe";
import { getCurrentUserId } from "~/lib/auth.server";
import { subscribeUser } from "~/lib/push.server";

export async function action(args: Route.ActionArgs) {
  if (args.request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const body = (await args.request.json().catch(() => null)) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  } | null;
  const { endpoint, keys } = body ?? {};
  if (
    typeof endpoint !== "string" ||
    !keys ||
    typeof keys.p256dh !== "string" ||
    typeof keys.auth !== "string"
  ) {
    return Response.json(
      { error: "Missing endpoint, keys.p256dh, or keys.auth" },
      { status: 400 },
    );
  }

  const userId = await getCurrentUserId(args);
  if (!userId) {
    return Response.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  await subscribeUser(userId, endpoint, keys.p256dh, keys.auth);
  return Response.json({ ok: true });
}
