import { NextResponse } from 'next/server'
import { unsubscribeUser } from '@/lib/actions/notification'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const endpoint = body?.endpoint
  if (typeof endpoint !== 'string') {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  }
  try {
    await unsubscribeUser(endpoint)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'UNAUTHENTICATED') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
