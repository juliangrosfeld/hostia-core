import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// DELETE — permanently remove a manager account from a property.
//
// The user must exist, be a manager, and belong to the property named in the
// URL (never delete a manager from another property). We delete their Supabase
// Auth user first, then their users row.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { id, userId } = await params
  const admin = createAdminClient()

  const { data: user, error } = await admin
    .from('users')
    .select('id, auth_id, role, property_id')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
  }
  if (user.role !== 'manager') {
    return NextResponse.json({ error: 'User is not a manager' }, { status: 400 })
  }
  if (user.property_id !== id) {
    return NextResponse.json({ error: 'Manager does not belong to this property' }, { status: 403 })
  }

  if (user.auth_id) {
    const { error: authError } = await admin.auth.admin.deleteUser(user.auth_id)
    if (authError) console.error(`[delete manager] auth user ${user.auth_id}:`, authError.message)
  }

  const { error: deleteError } = await admin.from('users').delete().eq('id', userId)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
