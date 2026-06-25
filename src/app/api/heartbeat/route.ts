import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: bump the signed-in user's last_active to now(). Called on every staff
// page load. Runs server-side (not from the client) and uses the service-role
// client for the write so the update is reliable regardless of the users-table
// RLS — the "active this week / this month" counts depend on it.
export async function POST() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('users')
    .update({ last_active: new Date().toISOString() })
    .eq('auth_id', user.id);

  if (error) {
    console.error('[heartbeat] last_active update error:', error);
    return NextResponse.json({ error: 'Could not update activity' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
