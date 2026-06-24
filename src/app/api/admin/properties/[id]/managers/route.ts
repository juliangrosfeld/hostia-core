import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Where accepted invites land. Kept here so the link is generated in exactly
// one place.
const APP_ORIGIN = 'https://hostia-core.vercel.app'

function inviteLink(token: string): string {
  return `${APP_ORIGIN}/accept-invite?token=${token}`
}

// GET — every manager on this property plus any still-pending invites.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { id } = await params
  const admin = createAdminClient()

  const { data: managers, error: managersError } = await admin
    .from('users')
    .select('id, full_name, email, last_active')
    .eq('property_id', id)
    .eq('role', 'manager')
    .order('full_name')

  if (managersError) {
    return NextResponse.json({ error: managersError.message }, { status: 500 })
  }

  const { data: invites, error: invitesError } = await admin
    .from('manager_invites')
    .select('id, email, full_name, invite_token, status, created_at, expires_at')
    .eq('property_id', id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (invitesError) {
    return NextResponse.json({ error: invitesError.message }, { status: 500 })
  }

  const pendingInvites = (invites ?? []).map((inv) => ({
    id: inv.id,
    email: inv.email,
    full_name: inv.full_name,
    status: inv.status,
    created_at: inv.created_at,
    expires_at: inv.expires_at,
    invite_link: inviteLink(inv.invite_token),
  }))

  return NextResponse.json({
    managers: managers ?? [],
    pendingInvites,
  })
}

// POST — create a manager invite. Body: { email, full_name }.
//
// Generates a one-time token, stores the invite, and returns the shareable
// accept-invite link. The link is the only thing the admin needs to hand off.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { id } = await params

  let body: { email?: unknown; full_name?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }
  if (!fullName) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Confirm the property exists before minting a token for it.
  const { data: property, error: propError } = await admin
    .from('properties')
    .select('id')
    .eq('id', id)
    .single()

  if (propError || !property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  // 16 random bytes → 32 hex chars. Unique-constrained in the DB as a backstop.
  const token = randomBytes(16).toString('hex')

  const { data: invite, error } = await admin
    .from('manager_invites')
    .insert({
      property_id: id,
      email,
      full_name: fullName,
      invite_token: token,
      status: 'pending',
      invited_by: gate.profile.id,
    })
    .select('id, email, full_name, invite_token, expires_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      full_name: invite.full_name,
      expires_at: invite.expires_at,
      invite_link: inviteLink(invite.invite_token),
    },
    invite_link: inviteLink(invite.invite_token),
  })
}
