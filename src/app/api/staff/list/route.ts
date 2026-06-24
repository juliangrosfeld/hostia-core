import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — the real staff roster for the requester's property.
//
// Scoped server-side: we read the caller's own property_id from their session
// and only ever return staff for that property. Uses the service-role client so
// it doesn't depend on how RLS is configured for cross-row reads.
export async function GET() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: requester, error: requesterError } = await supabase
    .from('users')
    .select('property_id, role')
    .eq('auth_id', authUser.id)
    .single()

  if (requesterError || !requester) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
  }

  if (requester.role !== 'manager' && requester.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: staff, error } = await admin
    .from('users')
    .select('id, full_name, email, role, xp, streak_days, last_active')
    .eq('property_id', requester.property_id)
    .eq('role', 'staff')
    .order('full_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ staff: staff ?? [] })
}
