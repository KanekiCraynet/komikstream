import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { clerkEnabled } from '@/lib/clerk-flags'

export { clerkEnabled }

export async function getCurrentUserId() {
  if (!clerkEnabled) return null
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress ?? `${userId}@clerk.local`

  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { email, lastSeenAt: new Date() },
    create: { clerkId: userId, email },
    select: { id: true },
  })

  return dbUser.id
}

export async function requireCurrentUserId() {
  const id = await getCurrentUserId()
  if (!id) throw new Error(clerkEnabled ? 'UNAUTHORIZED' : 'AUTH_DISABLED')
  return id
}

export async function getUserTier() {
  if (!clerkEnabled) return 'free' as const
  const id = await getCurrentUserId()
  if (!id) return 'free' as const
  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } })
  return (user?.tier ?? 'free') as 'free' | 'premium'
}
