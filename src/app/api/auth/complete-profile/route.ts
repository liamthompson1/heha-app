import { NextRequest, NextResponse } from 'next/server'
import { completeProfile } from '@/lib/auth/hx-client'

export async function POST(request: NextRequest) {
  let body: { givenName?: string; familyName?: string; contactNumber?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const hxToken = request.cookies.get('hx_auth_session')?.value
    ?? request.cookies.get('hx_bearer_token')?.value

  if (!hxToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const success = await completeProfile(hxToken, {
      givenName: body.givenName || undefined,
      familyName: body.familyName || undefined,
      contactNumber: body.contactNumber || undefined,
    })
    return NextResponse.json({ success })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save profile'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
