import { NextRequest, NextResponse } from 'next/server'
import { clearHistory, deleteHistory, listHistory, upsertHistory } from '@/lib/actions/history'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rawPage = Number(request.nextUrl.searchParams.get('page') ?? '1')
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  return NextResponse.json(await listHistory(page))
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { contentId?: unknown; lastPage?: unknown } | null
  if (
    typeof body?.contentId !== 'string' ||
    !body.contentId.trim() ||
    body.contentId.length > 200 ||
    typeof body.lastPage !== 'number' ||
    !Number.isInteger(body.lastPage) ||
    body.lastPage < 0
  ) {
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
