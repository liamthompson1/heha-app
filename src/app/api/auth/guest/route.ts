import { NextResponse } from 'next/server'
import { createSession, sessionCookieOptions } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/types'

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
  const normalized = email.toLowerCase().trim()
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const userHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  // Create guest session (authenticated so they can save trips)
  const sessionData: SessionData = {
    email: normalized,
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
