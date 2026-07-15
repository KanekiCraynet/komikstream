import { prisma } from '@/lib/db'
import { PaymentProvider } from '@/generated/prisma/enums'

/**
 * Internal subscription mutations — NOT exported from any 'use server' module.
 * Only reachable via API routes (webhook, admin).
 */
export async function activateSubscription(userId: string, externalId: string) {
  const endsAt = new Date()
  endsAt.setMonth(endsAt.getMonth() + 1)

  await prisma.$transaction(async (tx) => {
    // Idempotency: if externalId already processed, reject mutation
    const existing = await tx.subscription.findUnique({ where: { externalId }, select: { status: true, endsAt: true } })
    if (existing && existing.status === 'active') {
      // Already active — don't extend again (prevents webhook replay)
      return
    }

    await tx.subscription.upsert({
      where: { externalId },
      update: { status: 'active', endsAt, graceUntil: null },
      create: { userId, provider: PaymentProvider.ipaymu, externalId, status: 'active', endsAt },
    })
    await tx.user.update({ where: { id: userId }, data: { tier: 'premium' } })
  })
}

export async function expireSubscription(externalId: string) {
  const sub = await prisma.subscription.findUnique({ where: { externalId }, select: { userId: true } })
  if (!sub) return

  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({ where: { externalId }, data: { status: 'expired', endsAt: new Date() } })

    // Only downgrade user if NO active subscriptions remain
    const anyActive = await tx.subscription.findFirst({
      where: { userId: sub.userId, status: 'active' },
      select: { id: true },
    })
    if (!anyActive) {
      await tx.user.update({ where: { id: sub.userId }, data: { tier: 'free' } })
    }
  })
}
