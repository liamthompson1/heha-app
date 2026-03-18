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

  // Clear all HX auth cookies
  for (const name of ['hx_bearer_token', 'hx_auth_session', 'auth_session', 'hx_user_id']) {
    response.cookies.set(name, '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    })
  }

  return response
}
