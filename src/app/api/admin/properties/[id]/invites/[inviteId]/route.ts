import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// DELETE — cancel a pending manager invite. Scoped to the property in the URL so
// an invite can only be cancelled from the property it was created for.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { id, inviteId } = await params
  const admin = createAdminClient()

  const { error } = await admin
    .from('manager_invites')
    .delete()
    .eq('id', inviteId)
    .eq('property_id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
