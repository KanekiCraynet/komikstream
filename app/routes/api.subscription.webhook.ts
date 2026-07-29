import type { Route } from "./+types/api.subscription.webhook";
import { verifyIpaymuSignature } from "~/lib/ipaymu.server";
import { prisma } from "~/lib/db.server";
import {
  activateSubscription,
  expireSubscription,
} from "~/lib/subscription.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const raw = await request.text();
  const signature = request.headers.get("signature") ?? "";
  const va = process.env.IPAYMU_VA ?? "";
  const apiKey = process.env.IPAYMU_API_KEY ?? "";

  if (!va || !apiKey) return Response.json({ ok: true, disabled: true });
  if (!verifyIpaymuSignature(raw, signature, va, apiKey)) {
    return new Response("Signature invalid", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const trxId = String(body.trx_id ?? "");
  const referenceId = String(body.reference_id ?? "");
  const statusCode = String(body.status_code ?? body.status ?? "");
  if (!trxId || !referenceId) {
    return new Response("Missing fields", { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: referenceId },
    select: { id: true },
  });
  if (!user) return new Response("User not found", { status: 404 });

  if (statusCode === "1") {
    await activateSubscription(user.id, trxId);
  } else if (statusCode === "6") {
    const graceUntil = new Date();
    graceUntil.setDate(graceUntil.getDate() + 3);
    const existing = await prisma.subscription.findUnique({
      where: { externalId: trxId },
      select: { userId: true },
    });
    if (existing && existing.userId !== user.id) {
      return new Response("Subscription owner mismatch", { status: 409 });
    }
    await prisma.subscription.upsert({
      where: { externalId: trxId },
      update: { status: "grace", graceUntil },
      create: {
        userId: user.id,
        provider: "ipaymu",
        externalId: trxId,
        status: "grace",
        graceUntil,
      },
    });
  } else if (["2", "3", "4", "5", "7", "8", "9"].includes(statusCode)) {
    await expireSubscription(trxId);
  } else {
    return new Response("Unknown payment status", { status: 400 });
  }

  return Response.json({ ok: true });
}
