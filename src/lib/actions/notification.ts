'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function subscribeUser(endpoint: string, p256dh: string, auth: string) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('UNAUTHENTICATED')

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth },
    create: { userId, endpoint, p256dh, auth },
  })
  return { ok: true }
}

export async function unsubscribeUser(endpoint: string) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('UNAUTHENTICATED')

  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } })
  return { ok: true }
}

export async function listUserSubscriptions() {
  const userId = await getCurrentUserId()
  if (!userId) return []
  return prisma.pushSubscription.findMany({
    where: { userId },
    select: { endpoint: true, createdAt: true },
  })
}
