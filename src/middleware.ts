import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'heha_session'

const PROTECTED_PATHS = ['/trips', '/account']

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.SESSION_SECRET!)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path requires authentication
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value
  let isAuthenticated = false
  let sessionData: Record<string, unknown> = {}

  if (cookieValue) {
    try {
      const { payload } = await jwtVerify(cookieValue, getSecretKey())
      isAuthenticated = Boolean(payload.isAuthenticated)
      sessionData = payload as Record<string, unknown>
    } catch {
      // Invalid or expired token — treat as unauthenticated
    }
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/auth/entry', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Inject auth state into request headers for downstream use
  const response = NextResponse.next()
  response.headers.set('x-auth-authenticated', String(isAuthenticated))
  if (sessionData.email) {
    response.headers.set('x-auth-email', String(sessionData.email))
  }
  if (sessionData.userId) {
    response.headers.set('x-auth-user-id', String(sessionData.userId))
  }
  if (sessionData.userHash) {
    response.headers.set('x-auth-user-hash', String(sessionData.userHash))
  }

  return response
}

export const config = {
  matcher: ['/trips/:path*', '/account/:path*'],
}
