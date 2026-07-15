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
  // Derive entitlement from live subscription state, not stale User.tier —
  // premium expires automatically when endsAt/graceUntil passes.
  const now = new Date()
  const active = await prisma.subscription.findFirst({
    where: {
      userId: id,
      OR: [
        { status: 'active', endsAt: { gt: now } },
        { status: 'grace', graceUntil: { gt: now } },
      ],
    },
    select: { id: true },
  })
  return active ? ('premium' as const) : ('free' as const)
}
