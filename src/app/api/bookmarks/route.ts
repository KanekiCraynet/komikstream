import { NextRequest, NextResponse } from 'next/server'
import { listBookmarks, toggleBookmark } from '@/lib/actions/bookmark'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rawPage = Number(request.nextUrl.searchParams.get('page') ?? '1')
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  return NextResponse.json(await listBookmarks(page))
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { contentId?: unknown } | null
  if (typeof body?.contentId !== 'string' || !body.contentId) {
    return NextResponse.json({ error: 'INVALID_CONTENT_ID' }, { status: 400 })
  }
  return NextResponse.json(await toggleBookmark(body.contentId))
}
