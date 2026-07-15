import { NextResponse } from 'next/server'
import { requireCurrentUserId } from '@/lib/auth'
import { getSubscriptionStatus } from '@/lib/actions/subscription'
import { paymentEnabled } from '@/lib/ipaymu'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireCurrentUserId()
    if (!paymentEnabled) return NextResponse.json({ tier: 'free', subscription: null })
    const data = await getSubscriptionStatus()
    return NextResponse.json(data ?? { tier: 'free', subscription: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'UNAUTHORIZED' || message === 'AUTH_DISABLED') {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    return NextResponse.json({ error: 'SUBSCRIPTION_STATUS_FAILED' }, { status: 503 })
  }
}
