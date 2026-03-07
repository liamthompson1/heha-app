import { NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/auth/hx-client'
import { createSession, sessionCookieOptions, hashEmail } from '@/lib/auth/session'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { SessionData } from '@/lib/auth/types'

export async function POST(request: Request) {
  let body: { email?: string; otp?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, otp } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 })
  }

  if (!otp || typeof otp !== 'string') {
    return NextResponse.json({ error: 'Missing required field: otp' }, { status: 400 })
  }

  try {
    const { data, cookies } = await verifyOtp(email, otp)

    if (!data.success) {
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 401 })
    }

    // Generate userId from email hash (same algorithm as guest, for consistency)
    const normalized = email.toLowerCase().trim()
    const userHash = await hashEmail(email)

    // Upsert authenticated user into Supabase (upgrades guest → otp if exists)
    const supabase = getSupabaseClient()
    await supabase
      .from('users')
      .upsert(
        { id: userHash, email: normalized, auth_type: 'otp', last_seen_at: new Date().toISOString() },
        { onConflict: 'id' }
      )

    // Create heha session
    const sessionData: SessionData = {
      email: normalized,
      userId: userHash,
      userHash,
      isAuthenticated: true,
    }
    const token = await createSession(sessionData)
    const cookieOpts = sessionCookieOptions(token)

    const response = NextResponse.json({ success: true })

    // Set our session cookie
    response.cookies.set(cookieOpts.name, cookieOpts.value, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    })

    // Extract auth_session value from HX Set-Cookie headers.
    // We can't forward HX's cookies directly (browser rejects cross-domain Set-Cookie),
    // so we parse the value and store it in our own cookie.
    let hxAuthSession: string | null = null
    for (const setCookie of cookies) {
      const match = setCookie.match(/^auth_session=([^;]+)/)
      if (match) {
        hxAuthSession = match[1]
        break
      }
    }
    console.log("[Auth] OTP verify - auth_session from HX cookies:", !!hxAuthSession, "cookie count:", cookies.length)

    if (hxAuthSession) {
      response.cookies.set('hx_auth_session', hxAuthSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    // Store the firebaseToken as a fallback auth mechanism
    console.log("[Auth] OTP verify - firebaseToken present:", !!data.firebaseToken, "length:", data.firebaseToken?.length ?? 0)
    if (data.firebaseToken) {
      response.cookies.set('hx_bearer_token', data.firebaseToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OTP verification failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
