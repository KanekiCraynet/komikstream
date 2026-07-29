import { prisma } from "~/lib/db.server";

export async function getSubscriptionStatus(userId: string) {
  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      OR: [
        { status: "active", endsAt: { gt: now } },
        { status: "grace", graceUntil: { gt: now } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      status: true,
      provider: true,
      externalId: true,
      endsAt: true,
      graceUntil: true,
    },
  });
  return {
    tier: subscription ? ("premium" as const) : ("free" as const),
    subscription,
  };
}

export async function cancelSubscription(userId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: { userId, status: "active" },
      data: { status: "cancelled", endsAt: new Date() },
    });
    const now = new Date();
    const remaining = await tx.subscription.findFirst({
      where: {
        userId,
        OR: [
          { status: "active", endsAt: { gt: now } },
          { status: "grace", graceUntil: { gt: now } },
        ],
      },
      select: { id: true },
    });
    await tx.user.update({
      where: { id: userId },
      data: { tier: remaining ? "premium" : "free" },
    });
  });
  return { ok: true };
}

/**
 * Internal mutations — only reachable via webhook/admin routes.
 */
export async function activateSubscription(userId: string, externalId: string) {
  const endsAt = new Date();
  endsAt.setMonth(endsAt.getMonth() + 1);

  await prisma.$transaction(async (tx) => {
    // Idempotency: replayed webhook must not extend an active subscription.
    const existing = await tx.subscription.findUnique({
      where: { externalId },
      select: { status: true, userId: true },
    });
    if (existing && existing.userId !== userId) {
      throw new Error("SUBSCRIPTION_OWNER_MISMATCH");
    }
    if (existing && existing.status === "active") return;

    await tx.subscription.upsert({
      where: { externalId },
      update: { status: "active", endsAt, graceUntil: null },
      create: {
        userId,
        provider: "ipaymu",
        externalId,
        status: "active",
        endsAt,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { tier: "premium" },
    });
  });
}

export async function expireSubscription(externalId: string) {
  await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.findUnique({
      where: { externalId },
      select: { userId: true },
    });
    if (!sub) return;
    await tx.subscription.update({
      where: { externalId },
      data: { status: "expired", endsAt: new Date() },
    });
    const anyActive = await tx.subscription.findFirst({
      where: { userId: sub.userId, status: "active" },
      select: { id: true },
    });
    if (!anyActive) {
      await tx.user.update({
        where: { id: sub.userId },
        data: { tier: "free" },
      });
    }
  });
}
