import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Shared guard for the /api/admin/* routes. Confirms the requester is signed in
// AND has role === 'admin' in the users table before any admin-client work runs.
//
// Returns either `{ error }` (a ready-to-return NextResponse with the right
// status) or `{ profile }` (the admin's users-table row). Usage:
//
//   const gate = await requireAdmin()
//   if (gate.error) return gate.error
//   const { profile } = gate
export async function requireAdmin(): Promise<
  | { error: NextResponse; profile?: undefined }
  | { error?: undefined; profile: { id: string; role: string; property_id: string } }
> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, property_id')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 }) }
  }

  return { profile }
}
