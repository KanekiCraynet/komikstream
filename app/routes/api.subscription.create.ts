import type { Route } from "./+types/api.subscription.create";
import { requireCurrentUserId } from "~/lib/auth.server";
import { createRedirectPayment, paymentEnabled } from "~/lib/ipaymu.server";

export async function action(args: Route.ActionArgs) {
  if (args.request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!paymentEnabled) {
    return Response.json({ error: "PAYMENT_DISABLED" }, { status: 503 });
  }

  try {
    const userId = await requireCurrentUserId(args);
    const payment = await createRedirectPayment({
      product: ["KuroManga Premium Monthly"],
      qty: [1],
      price: [29000],
      referenceId: userId,
    });
    return Response.json({ url: payment.Url, sessionId: payment.SessionID });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SUBSCRIPTION_CREATE_FAILED";
    const status =
      message === "UNAUTHORIZED" || message === "AUTH_DISABLED" ? 401 : 502;
    return Response.json(
      { error: status === 401 ? message : "SUBSCRIPTION_CREATE_FAILED" },
      { status },
    );
  }
}
