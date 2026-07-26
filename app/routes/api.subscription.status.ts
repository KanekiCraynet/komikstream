import type { Route } from "./+types/api.subscription.status";
import { requireCurrentUserId } from "~/lib/auth.server";
import { paymentEnabled } from "~/lib/ipaymu.server";
import { getSubscriptionStatus } from "~/lib/subscription.server";

export async function loader(args: Route.LoaderArgs) {
  try {
    const userId = await requireCurrentUserId(args);
    if (!paymentEnabled) {
      return Response.json({ tier: "free", subscription: null });
    }
    return Response.json(await getSubscriptionStatus(userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED" || message === "AUTH_DISABLED") {
      return Response.json({ error: message }, { status: 401 });
    }
    return Response.json(
      { error: "SUBSCRIPTION_STATUS_FAILED" },
      { status: 503 },
    );
  }
}
