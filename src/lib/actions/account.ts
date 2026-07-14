'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'
import { UserPreferencesSchema } from '@/lib/validations/user'

export async function getPreferences() {
  const userId = await getCurrentUserId()
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true, email: true, tier: true } })
  return user
}

export async function updatePreferences(input: unknown) {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false, error: 'UNAUTHORIZED' }

  const parsed = UserPreferencesSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'INVALID' }

  await prisma.user.update({ where: { id: userId }, data: { preferences: parsed.data } })
  return { ok: true }
}

export async function deleteAccount() {
  const userId = await getCurrentUserId()
  if (!userId) return { ok: false }
  // Cascade: bookmarks + history via onDelete: Cascade in schema
  await prisma.user.delete({ where: { id: userId } })
  return { ok: true }
}
