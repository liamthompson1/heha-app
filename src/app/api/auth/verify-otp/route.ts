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

    // Upsert user in Supabase
    const userHash = await hashEmail(email)
    const supabase = getSupabaseClient()
    await supabase
      .from('users')
      .upsert(
        { id: userHash, email: email.toLowerCase().trim(), auth_type: 'holiday_extras', last_seen_at: new Date().toISOString() },
        { onConflict: 'id' }
      )

    // Create heha session
    const sessionData: SessionData = {
      email,
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

    // Forward HX auth cookies to the browser
    for (const setCookie of cookies) {
      response.headers.append('Set-Cookie', setCookie)
    }

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OTP verification failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
