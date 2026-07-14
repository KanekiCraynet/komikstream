import { Webhook } from 'svix'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { clerkEnabled } from '@/lib/clerk-flags'

export const runtime = 'nodejs'

const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET

export async function POST(request: NextRequest) {
  if (!clerkEnabled) return NextResponse.json({ ok: true })

  if (!secret) return new NextResponse('Not configured', { status: 501 })

  const payload = await request.text()
  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Missing Svix headers', { status: 400 })
  }

  const wh = new Webhook(secret)

  let evt: { type?: string; data?: { id?: string; email_addresses?: Array<{ email_address: string }> } }
  try {
    evt = wh.verify(payload, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': svixSignature }) as typeof evt
  } catch {
    return new NextResponse('Signature invalid', { status: 401 })
  }

  if (evt.type === 'user.deleted' && evt.data?.id) {
    await prisma.user.deleteMany({ where: { clerkId: evt.data.id } })
  }

  return NextResponse.json({ ok: true })
}