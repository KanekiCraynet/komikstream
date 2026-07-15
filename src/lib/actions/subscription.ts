'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function getSubscriptionStatus() {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const now = new Date()
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      OR: [
        { status: 'active', endsAt: { gt: now } },
        { status: 'grace', graceUntil: { gt: now } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    select: { status: true, provider: true, externalId: true, endsAt: true, graceUntil: true },
  })

  return { tier: subscription ? ('premium' as const) : ('free' as const), subscription }
}

export async function cancelSubscription() {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: 'UNAUTHORIZED' }

  await prisma.$transaction([
    prisma.subscription.updateMany({ where: { userId, status: 'active' }, data: { status: 'cancelled', endsAt: new Date() } }),
    prisma.user.update({ where: { id: userId }, data: { tier: 'free' } }),
  ])

  return { ok: true }
}
