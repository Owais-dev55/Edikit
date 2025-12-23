import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('user_token')?.value
  const pathname = request.nextUrl.pathname

  console.log('Middleware cookie:', token)

  if (pathname.startsWith('/customize') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  console.log('Middleware hit:', request.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: '/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)',
}

