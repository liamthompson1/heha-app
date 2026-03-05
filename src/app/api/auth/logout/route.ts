import { NextResponse } from 'next/server'
import { clearSessionCookieOptions } from '@/lib/auth/session'

export async function POST() {
  const cookieOpts = clearSessionCookieOptions()
  const response = NextResponse.json({ success: true })

  response.cookies.set(cookieOpts.name, cookieOpts.value, {
    httpOnly: cookieOpts.httpOnly,
    path: cookieOpts.path,
    maxAge: cookieOpts.maxAge,
  })

  // Clear HX auth cookies
  response.cookies.set('hx_auth_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })
  response.cookies.set('hx_bearer_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })

  return response
}
