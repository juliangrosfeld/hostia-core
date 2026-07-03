import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Phase } from '@/lib/curriculum';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phases[?track=casual-dining]
// Public reference data — the `phases` and `module_phase_assignments` RLS
// policies allow everyone to read, so no auth is required. Returns all phases
// (optionally filtered to a single track) ordered by phase_number ascending,
// plus the module→phase assignments for those phases so admin UIs can group
// modules from the SAME source the staff curriculum uses — never from
// hardcoded phase fields in curriculum.ts.
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

  const phases = (data ?? []) as Phase[];

  let assignments: { module_id: string; phase_id: string; order_in_phase: number }[] = [];
  if (phases.length > 0) {
    const { data: mpa, error: mpaError } = await supabase
      .from('module_phase_assignments')
      .select('module_id, phase_id, order_in_phase')
      .in('phase_id', phases.map((p) => p.id));
    if (mpaError) return NextResponse.json({ error: mpaError.message }, { status: 500 });
    assignments = mpa ?? [];
  }

  return NextResponse.json({ phases, assignments });
}
