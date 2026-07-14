import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = ['img.komiku.org', 'yuucdn.net', 'uqni.net']

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url')
  if (!urlParam) return new NextResponse('Bad Request', { status: 400 })

  let target: URL
  try {
    target = new URL(urlParam)
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  if (!ALLOWED_HOSTS.some(h => target.hostname.includes(h)))
    return new NextResponse('Forbidden', { status: 403 })

  const resp = await fetch(target, {
    headers: { 'User-Agent': 'KomikStream/1.0' },
  })
  if (!resp.ok)
    return new NextResponse('Upstream error', { status: resp.status })

  const headers = new Headers(resp.headers)
  headers.set('Cache-Control', 'public, max-age=86400')
  // sanitize — only pass through safe content types
  const ct = headers.get('Content-Type') ?? ''
  if (!ct.startsWith('image/')) return new NextResponse('Forbidden', { status: 403 })

  return new NextResponse(resp.body, {
    status: 200,
    headers,
  })
}
