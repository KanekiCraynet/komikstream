import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  const expected = process.env.CRON_SECRET
  const secretBuffer = Buffer.from(secret ?? '')
  const expectedBuffer = Buffer.from(expected ?? '')
  if (!expected || !secret || secretBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(secretBuffer, expectedBuffer))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as { type?: string } | null
  const type = body?.type
  if (!type || !['komik', 'chapter'].includes(type))
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  // ponytail: actual cache invalidation against CF/CDN is infra-specific;
  // the endpoint structure is here so deploy scripts can wire it later
  return NextResponse.json({ ok: true, type, timestamp: Date.now() })
}
