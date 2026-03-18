import { NextRequest, NextResponse } from 'next/server'
import { getSession, getSessionCookieName } from '@/lib/auth/session'
import { getTravellerAuthToken } from '@/lib/traveller/client'

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(getSessionCookieName())?.value
  const session = await getSession(cookieValue)

  if (!session || !session.isAuthenticated) {
    return NextResponse.json({
      authenticated: false,
    })
  }

  const hxToken = getTravellerAuthToken(
    (name) => request.cookies.get(name)?.value
  )

  return NextResponse.json({
    authenticated: true,
    email: session.email,
    userId: session.userId,
    userHash: session.userHash,
    isHxUser: !!hxToken,
  })
}
