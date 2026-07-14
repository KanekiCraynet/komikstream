import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySignature, paymentEnabled } from '@/lib/ipaymu'
import { PaymentProvider } from '@/generated/prisma/enums'
import { activateSubscription, expireSubscription } from '@/lib/actions/subscription'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!paymentEnabled) return NextResponse.json({ ok: true })

  const raw = await request.text()
  const signature = request.headers.get('signature') ?? ''

  if (!verifySignature(raw, signature)) {
    return new NextResponse('Signature invalid', { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  // iPaymu sends: trx_id, reference_id (our userId), status_code, status
  const trxId = String(body.trx_id ?? '')
  const referenceId = String(body.reference_id ?? '')
  const statusCode = String(body.status_code ?? body.status ?? '')

  if (!trxId || !referenceId) {
    return new NextResponse('Missing fields', { status: 400 })
  }

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: referenceId }, select: { id: true } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  // status_code 1 = berhasil/paid, 6 = pending, others = failed/cancelled/expired
  if (statusCode === '1') {
    await activateSubscription(user.id, trxId)
  } else if (statusCode === '6') {
    // pending — grace period 3 days
    const graceUntil = new Date()
    graceUntil.setDate(graceUntil.getDate() + 3)
    await prisma.subscription.upsert({
      where: { externalId: trxId },
      update: { status: 'grace', graceUntil },
      create: { userId: user.id, provider: PaymentProvider.ipaymu, externalId: trxId, status: 'grace', graceUntil },
    })
  } else {
    // expired/cancelled/failed
    await expireSubscription(trxId)
  }

  return NextResponse.json({ ok: true })
}
