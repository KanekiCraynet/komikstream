import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextRequest, NextResponse, NextFetchEvent } from 'next/server'
import { clerkEnabled } from '@/lib/clerk-flags'

const clerkHandler = clerkEnabled ? clerkMiddleware() : null

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  let response = NextResponse.next()
  if (clerkHandler) {
    const clerkRes = await clerkHandler(request, event)
    if (clerkRes) {
      response = clerkRes instanceof NextResponse
        ? clerkRes
        : new NextResponse(clerkRes.body, {
            status: clerkRes.status,
            statusText: clerkRes.statusText,
            headers: clerkRes.headers,
          })
    }
  }

  // CSP — ponytail: tighten script-src once Turbopack resolves hashes
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
  )

  return response
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
