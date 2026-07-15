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

  if (target.protocol !== 'https:')
    return new NextResponse('Forbidden', { status: 403 })

  // strict suffix match — prevents SSRF via subdomain bypass
  if (!ALLOWED_HOSTS.some(h => target.hostname === h || target.hostname.endsWith('.' + h)))
    return new NextResponse('Forbidden', { status: 403 })

  let resp: Response
  try {
    resp = await fetch(target, {
      headers: { 'User-Agent': 'KomikStream/1.0' },
      redirect: 'manual', // don't follow redirects — prevents SSRF via upstream redirect
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return new NextResponse('Upstream unreachable', { status: 502 })
  }
  if (resp.status >= 300 && resp.status < 400)
    return new NextResponse('Upstream redirect forbidden', { status: 502 })
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
