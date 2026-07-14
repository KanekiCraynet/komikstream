'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function upsertHistory(contentId: string, lastPage: number) {
  const userId = await getCurrentUserId()
  if (!userId) return

  await prisma.history.upsert({
    where: { userId_contentId_contentType: { userId, contentId, contentType: 'komik' } },
    update: { lastPage },
    create: { userId, contentId, contentType: 'komik', lastPage },
  })

  // FIFO 500: keep most recent 500 per user
  const count = await prisma.history.count({ where: { userId } })
  if (count > 500) {
    const excess = await prisma.history.findMany({
      where: { userId },
      orderBy: { updatedAt: 'asc' },
      take: count - 500,
      select: { id: true },
    })
    if (excess.length > 0) {
      await prisma.history.deleteMany({
        where: { id: { in: excess.map((e) => e.id) } },
      })
    }
  }
}

export async function listHistory(page = 1, limit = 20) {
  const userId = await getCurrentUserId()
  if (!userId) return { items: [], total: 0 }

  const [items, total] = await Promise.all([
    prisma.history.findMany({
      where: { userId, contentType: 'komik' },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.history.count({ where: { userId, contentType: 'komik' } }),
  ])

  return { items, total }
}

export async function deleteHistory(contentId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return
  await prisma.history.deleteMany({ where: { userId, contentId, contentType: 'komik' } })
}

export async function clearHistory() {
  const userId = await getCurrentUserId()
  if (!userId) return
  await prisma.history.deleteMany({ where: { userId } })
}
