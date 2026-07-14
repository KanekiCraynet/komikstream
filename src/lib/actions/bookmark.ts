'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function toggleBookmark(contentId: string): Promise<{ bookmarked: boolean }> {
  const userId = await getCurrentUserId()
  if (!userId) return { bookmarked: false }

  const existing = await prisma.bookmark.findUnique({
    where: { userId_contentId_contentType: { userId, contentId, contentType: 'komik' } },
    select: { id: true },
  })

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } })
    return { bookmarked: false }
  }

  await prisma.bookmark.create({ data: { userId, contentId, contentType: 'komik' } })
  return { bookmarked: true }
}

export async function isBookmarked(contentId: string): Promise<boolean> {
  const userId = await getCurrentUserId()
  if (!userId) return false
  const hit = await prisma.bookmark.findUnique({
    where: { userId_contentId_contentType: { userId, contentId, contentType: 'komik' } },
    select: { id: true },
  })
  return !!hit
}

export async function listBookmarks(page = 1, limit = 20) {
  const userId = await getCurrentUserId()
  if (!userId) return { items: [], total: 0 }

  const [items, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId, contentType: 'komik' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bookmark.count({ where: { userId, contentType: 'komik' } }),
  ])

  return { items, total }
}
