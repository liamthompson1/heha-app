import { NextResponse } from 'next/server'
import { createSession, sessionCookieOptions, hashEmail } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/types'
import { getSupabaseClient } from '@/lib/supabase/client'

interface GuestBody {
  email: string
}

export async function POST(request: Request) {
  let body: GuestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 })
  }

  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  // Generate SHA-256 hash of normalized email
  const userHash = await hashEmail(email)

  // Upsert guest user into Supabase
  const supabase = getSupabaseClient()
  await supabase
    .from('users')
    .upsert(
      { id: userHash, email: normalized, auth_type: 'guest', last_seen_at: new Date().toISOString() },
      { onConflict: 'id' }
    )

  // Create guest session (authenticated so they can save trips)
  const sessionData: SessionData = {
    email: email.toLowerCase().trim(),
    userId: userHash,
    userHash,
    isAuthenticated: true,
  }
  const token = await createSession(sessionData)
  const cookieOpts = sessionCookieOptions(token)

  const response = NextResponse.json({ userHash })

  response.cookies.set(cookieOpts.name, cookieOpts.value, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: cookieOpts.maxAge,
  })

  return response
}
