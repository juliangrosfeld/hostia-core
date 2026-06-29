import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Phase } from '@/lib/curriculum';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phases[?track=casual-dining]
// Public reference data — the `phases` RLS policy allows everyone to read, so no
// auth is required. Returns all phases (optionally filtered to a single track),
// ordered by phase_number ascending.
export async function GET(req: NextRequest) {
  const track = req.nextUrl.searchParams.get('track');

  const supabase = await createClient();
  let query = supabase
    .from('phases')
    .select('id, track, phase_number, title, goal, outcome, certification_title, order_index')
    .order('phase_number', { ascending: true });

  if (track) query = query.eq('track', track);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ phases: (data ?? []) as Phase[] });
}
