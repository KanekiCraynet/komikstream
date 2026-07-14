'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'
import { PaymentProvider } from '@/generated/prisma/enums'

export async function getSubscriptionStatus() {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { tier: true } }),
    prisma.subscription.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { status: true, provider: true, externalId: true, endsAt: true, graceUntil: true },
    }),
  ])

  return { tier: user?.tier ?? 'free', subscription }
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

export async function activateSubscription(userId: string, externalId: string) {
  const endsAt = new Date()
  endsAt.setMonth(endsAt.getMonth() + 1)

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { externalId },
      update: { status: 'active', endsAt, graceUntil: null },
      create: { userId, provider: PaymentProvider.ipaymu, externalId, status: 'active', endsAt },
    }),
    prisma.user.update({ where: { id: userId }, data: { tier: 'premium' } }),
  ])
}

export async function expireSubscription(externalId: string) {
  const sub = await prisma.subscription.findUnique({ where: { externalId }, select: { userId: true } })
  if (!sub) return

  await prisma.$transaction([
    prisma.subscription.update({ where: { externalId }, data: { status: 'expired', endsAt: new Date() } }),
    prisma.user.update({ where: { id: sub.userId }, data: { tier: 'free' } }),
  ])
}
