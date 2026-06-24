import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PUBLIC route — no admin gate. A valid, unexpired, still-pending token is the
// only credential. All DB access goes through the service-role client because
// RLS on manager_invites is fully closed.

// Look up a usable invite by token: pending and not past its expiry.
async function findValidInvite(token: string) {
  const admin = createAdminClient()
  const { data: invite } = await admin
    .from('manager_invites')
    .select('id, property_id, email, full_name, status, expires_at')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .maybeSingle()

  if (!invite) return null
  if (new Date(invite.expires_at).getTime() <= Date.now()) return null
  return invite
}

// GET — validate a token and return what the accept page needs to render:
// the invitee's name and the property they're being asked to manage.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ valid: false, error: 'Missing invite token' }, { status: 400 })
  }

  const invite = await findValidInvite(token)
  if (!invite) {
    return NextResponse.json(
      { valid: false, error: 'This invite is invalid, already used, or expired.' },
      { status: 404 }
    )
  }

  const admin = createAdminClient()
  const { data: property } = await admin
    .from('properties')
    .select('name')
    .eq('id', invite.property_id)
    .single()

  return NextResponse.json({
    valid: true,
    invite: {
      email: invite.email,
      full_name: invite.full_name,
      property_name: property?.name ?? 'your property',
    },
  })
}

// POST — accept the invite. Body: { token, password }.
//
//   1. Re-validate the token (never trust the client's word that it's valid).
//   2. Create a Supabase auth user with the invite email + chosen password.
//   3. Insert the matching users-table row as a manager on the property.
//   4. Mark the invite accepted.
//
// On success the manager can sign in normally at /login.
export async function POST(request: NextRequest) {
  let body: { token?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!token) {
    return NextResponse.json({ error: 'Missing invite token' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const invite = await findValidInvite(token)
  if (!invite) {
    return NextResponse.json(
      { error: 'This invite is invalid, already used, or expired.' },
      { status: 404 }
    )
  }

  const admin = createAdminClient()

  // 1. Create the auth user. email_confirm so they can log in immediately.
  const { data: newAuthUser, error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  })

  if (createError || !newAuthUser.user) {
    return NextResponse.json(
      { error: createError?.message || 'Could not create your account.' },
      { status: 400 }
    )
  }

  // 2. Insert the manager profile row.
  const { error: insertError } = await admin
    .from('users')
    .insert({
      auth_id: newAuthUser.user.id,
      property_id: invite.property_id,
      full_name: invite.full_name,
      email: invite.email,
      role: 'manager',
    })

  if (insertError) {
    // Roll back the auth user so a retry isn't blocked by a half-created account.
    await admin.auth.admin.deleteUser(newAuthUser.user.id)
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  // 3. Burn the invite.
  const { error: updateError } = await admin
    .from('manager_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  if (updateError) {
    // The account is live — log but don't fail the request over the bookkeeping.
    console.error('Failed to mark invite accepted:', updateError.message)
  }

  return NextResponse.json({ success: true, email: invite.email })
}
