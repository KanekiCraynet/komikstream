import { NextResponse } from 'next/server'
import { requireCurrentUserId } from '@/lib/auth'
import { getSubscriptionStatus } from '@/lib/actions/subscription'
import { paymentEnabled } from '@/lib/ipaymu'

export const runtime = 'nodejs'

export async function GET() {
  if (!paymentEnabled) return NextResponse.json({ tier: 'free', subscription: null })

  try {
    await requireCurrentUserId()
    const data = await getSubscriptionStatus()
    return NextResponse.json(data ?? { tier: 'free', subscription: null })
  } catch {
    return NextResponse.json({ tier: 'free', subscription: null })
  }
}
