import { NextResponse } from 'next/server'
import { createAccountAndSignIn, requestOtp } from '@/lib/auth/hx-client'
import { createSession, sessionCookieOptions, hashEmail } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/types'
import { randomBytes } from 'crypto'

const HX_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

export async function POST(request: Request) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  const userHash = await hashEmail(email)

  try {
    // ── Try creating a new account first ──────────────────────────────────────
    // If it succeeds → new user, session established, skip OTP entirely.
    // If it fails (account already exists) → fall through to OTP.
    try {
      const password = randomBytes(16).toString('base64url')
      const { firebaseToken, cookies } = await createAccountAndSignIn(email, password)

      const sessionData: SessionData = {
        email: email.toLowerCase().trim(),
        userId: userHash,
        userHash,
        isAuthenticated: true,
      }
      const token = await createSession(sessionData)
      const cookieOpts = sessionCookieOptions(token)

      const response = NextResponse.json({ success: true, isNewAccount: true })

      response.cookies.set(cookieOpts.name, cookieOpts.value, {
        httpOnly: cookieOpts.httpOnly,
        secure: cookieOpts.secure,
        sameSite: cookieOpts.sameSite,
        path: cookieOpts.path,
        maxAge: cookieOpts.maxAge,
      })

      for (const setCookie of cookies) {
        const match = setCookie.match(/^auth_session=([^;]+)/)
        if (match) {
          response.cookies.set('hx_auth_session', match[1], HX_COOKIE_OPTS)
          break
        }
      }

      if (firebaseToken) {
        response.cookies.set('hx_bearer_token', firebaseToken, HX_COOKIE_OPTS)
      }

      response.cookies.set('hx_user_id', userHash, HX_COOKIE_OPTS)

      return response
    } catch {
      // Account already exists — fall through to OTP
    }

    // ── Existing user: send OTP as normal ─────────────────────────────────────
    const result = await requestOtp(email)

    if (result.smsError && result.emailError) {
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP', smsError: result.smsError, emailError: result.emailError },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success: true,
      isNewAccount: false,
      smsSentTo: result.smsSentToContactNumberEnding ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OTP request failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
