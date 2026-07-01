import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// DELETE — a manager permanently removes a staff member from their own property.
//
// Security: the requester must be a signed-in manager, and the target must be a
// staff member on the SAME property. Cross-property deletion is never allowed.
// The target's Supabase Auth user is deleted via the admin client, after their
// child rows are removed in dependency order.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()

  // 1. Requester must be authenticated.
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Requester must be a manager; capture their property_id.
  const { data: manager, error: managerError } = await supabase
    .from('users')
    .select('property_id, role')
    .eq('auth_id', authUser.id)
    .single()

  if (managerError || !manager) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
  }
  if (manager.role !== 'manager') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  if (!manager.property_id) {
    return NextResponse.json({ error: 'No property associated with this account' }, { status: 400 })
  }

  const { userId } = await params
  const admin = createAdminClient()

  // 3. Target must exist, be staff, and be on the manager's property.
  const { data: target, error: targetError } = await admin
    .from('users')
    .select('id, auth_id, role, property_id')
    .eq('id', userId)
    .single()

  if (targetError || !target) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  }
  if (target.role !== 'staff' || target.property_id !== manager.property_id) {
    return NextResponse.json({ error: 'Cannot delete this staff member' }, { status: 403 })
  }

  // 4. Delete child rows in dependency order.
  const scopedTables = ['roleplay_sessions', 'lesson_completions', 'phase_completions'] as const
  for (const table of scopedTables) {
    const { error } = await admin.from(table).delete().eq('staff_id', userId)
    if (error) {
      return NextResponse.json(
        { error: `Failed to delete ${table}: ${error.message}` },
        { status: 500 }
      )
    }
  }

  // 5. Delete the auth user, then the users row.
  if (target.auth_id) {
    const { error: authError } = await admin.auth.admin.deleteUser(target.auth_id)
    if (authError) console.error(`[delete staff] auth user ${target.auth_id}:`, authError.message)
  }

  const { error: deleteError } = await admin.from('users').delete().eq('id', userId)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
