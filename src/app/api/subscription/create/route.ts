import { NextResponse } from 'next/server'
import { requireCurrentUserId } from '@/lib/auth'
import { createRedirectPayment, paymentEnabled } from '@/lib/ipaymu'

export const runtime = 'nodejs'

export async function POST() {
  if (!paymentEnabled) return NextResponse.json({ error: 'PAYMENT_DISABLED' }, { status: 503 })

  try {
    const userId = await requireCurrentUserId()
    const payment = await createRedirectPayment({
      product: ['KuroManga Premium Monthly'],
      qty: [1],
      price: [29000],
      referenceId: userId,
    })

    return NextResponse.json({ url: payment.Url, sessionId: payment.SessionID })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SUBSCRIPTION_CREATE_FAILED'
    const status = message === 'UNAUTHORIZED' || message === 'AUTH_DISABLED' ? 401 : 502
    return NextResponse.json({ error: status === 401 ? message : 'SUBSCRIPTION_CREATE_FAILED' }, { status })
  }
}
