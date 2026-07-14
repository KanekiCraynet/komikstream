import { NextRequest, NextResponse } from 'next/server'
import { subscribeUser } from '@/lib/actions/notification'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const { endpoint, keys } = (body ?? {}) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
  if (typeof endpoint !== 'string' || !keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
    return NextResponse.json({ error: 'Missing endpoint, keys.p256dh, or keys.auth' }, { status: 400 })
  }
  try {
    await subscribeUser(endpoint, keys.p256dh, keys.auth)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'UNAUTHENTICATED') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
