import { Webhook } from "svix";
import type { Route } from "./+types/api.webhooks.clerk";
import { prisma } from "~/lib/db.server";
import { clerkEnabled } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!clerkEnabled) return Response.json({ ok: true });

  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) return new Response("Not configured", { status: 501 });

  const payload = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const wh = new Webhook(secret);
  let evt: { type?: string; data?: { id?: string } };
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof evt;
  } catch {
    return new Response("Signature invalid", { status: 401 });
  }

  if (evt.type === "user.deleted" && evt.data?.id) {
    await prisma.user.deleteMany({ where: { clerkId: evt.data.id } });
  }

  return Response.json({ ok: true });
}
