import { NextRequest, NextResponse } from 'next/server'
import { signInWithEmailHash } from '@/lib/auth/hx-rest-client'
import { createSession, sessionCookieOptions, hashEmail } from '@/lib/auth/session'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { SessionData } from '@/lib/auth/types'

interface SignInBody {
  email: string
  timestamp: number
  hash: string
  url?: string
}

export async function POST(request: NextRequest) {
  let body: SignInBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, timestamp, hash, url } = body

  if (!email || !timestamp || !hash) {
    return NextResponse.json(
      { error: 'Missing required fields: email, timestamp, hash' },
      { status: 400 },
    )
  }

  try {
    const result = await signInWithEmailHash({ email, timestamp, hash, url })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Sign-in failed', redirectUrl: result.redirectUrl },
        { status: 401 },
      )
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

    // Create a heha session
    const sessionData: SessionData = {
      email,
      userId: userHash,
      userHash,
      isAuthenticated: true,
    }
    const token = await createSession(sessionData)
    const cookieOpts = sessionCookieOptions(token)

    const response = NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
    })

    response.cookies.set(cookieOpts.name, cookieOpts.value, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    })

    // Forward auth cookies from HX
    for (const cookie of result.cookies) {
      response.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly ?? true,
        secure: cookie.secure ?? process.env.NODE_ENV === 'production',
        path: cookie.path ?? '/',
        ...(cookie.expires && { expires: new Date(cookie.expires) }),
      })
    }

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign-in request failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
