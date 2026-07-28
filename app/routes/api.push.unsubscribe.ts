import type { Route } from "./+types/api.push.unsubscribe";
import { getCurrentUserId } from "~/lib/auth.server";
import { unsubscribeUser } from "~/lib/push.server";
import { requireSameOrigin } from "~/lib/csrf.server";

export async function action(args: Route.ActionArgs) {
  if (args.request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const originError = requireSameOrigin(args.request);
  if (originError) return originError;
  const body = (await args.request.json().catch(() => null)) as {
    endpoint?: unknown;
  } | null;
  if (typeof body?.endpoint !== "string") {
    return Response.json({ error: "Missing endpoint" }, { status: 400 });
  }

  const userId = await getCurrentUserId(args);
  if (!userId) {
    return Response.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  await unsubscribeUser(userId, body.endpoint);
  return Response.json({ ok: true });
}
