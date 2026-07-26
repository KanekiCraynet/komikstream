import type { Route } from "./+types/api.subscription.webhook";
import { verifyIpaymuSignature } from "~/lib/ipaymu.server";

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

  if (!body.trx_id || !body.reference_id) {
    return new Response("Missing fields", { status: 400 });
  }

  return Response.json({ ok: true });
}
