import { NextRequest, NextResponse } from 'next/server'
import { clearHistory, deleteHistory, listHistory, upsertHistory } from '@/lib/actions/history'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get('page') ?? '1')
  return NextResponse.json(await listHistory(Number.isFinite(page) ? page : 1))
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { contentId?: unknown; lastPage?: unknown } | null
  if (typeof body?.contentId !== 'string' || typeof body.lastPage !== 'number') {
    return NextResponse.json({ error: 'INVALID_HISTORY' }, { status: 400 })
  }
  await upsertHistory(body.contentId, body.lastPage)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const contentId = request.nextUrl.searchParams.get('contentId')
  if (contentId) await deleteHistory(contentId)
  else await clearHistory()
  return NextResponse.json({ ok: true })
}
