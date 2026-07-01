import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PHASES = ['learn', 'practice', 'apply'] as const;
type Phase = (typeof PHASES)[number];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

// GET: the signed-in staff member's completed lessons. Reuses the exact same
// "any phase completion counts" definition as the home-progress / curriculum
// module-progress endpoints — a lesson is completed once it has at least one
// lesson_completions row (learn, practice, or apply). Returns distinct
// { module_id, lesson_id } pairs so the client can mark lessons done without
// re-deriving completion. RLS scopes the read to the caller's own rows.
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, property_id')
    .eq('auth_id', user.id)
    .single();

  if (!profile?.property_id) {
    return NextResponse.json({ completed: [] });
  }

  const { data, error } = await supabase
    .from('lesson_completions')
    .select('module_id, lesson_id')
    .eq('property_id', profile.property_id)
    .eq('staff_id', profile.id);

  if (error) {
    console.error('[lesson-completions] read error:', error);
    return NextResponse.json({ error: 'Could not load completions' }, { status: 500 });
  }

  // De-dupe (a lesson has one row per finished phase) → distinct lessons.
  const seen = new Set<string>();
  const completed: { module_id: string; lesson_id: string }[] = [];
  for (const row of data ?? []) {
    const key = `${row.module_id}::${row.lesson_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    completed.push({ module_id: row.module_id, lesson_id: row.lesson_id });
  }

  return NextResponse.json({ completed });
}

// POST: log that the signed-in staff member finished a lesson phase.
// Idempotent — repeat calls for the same (staff, lesson, phase) are no-ops and
// report already_completed: true. Uses the standard (anon, session-bound)
// server client so RLS enforces that staff can only write their own rows.
export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Must be a logged-in user.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse + validate the body.
  let body: { module_id?: unknown; lesson_id?: unknown; phase?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const { module_id, lesson_id, phase } = body;

  if (!isNonEmptyString(module_id)) {
    return NextResponse.json({ error: 'Missing or invalid field: module_id' }, { status: 400 });
  }
  if (!isNonEmptyString(lesson_id)) {
    return NextResponse.json({ error: 'Missing or invalid field: lesson_id' }, { status: 400 });
  }
  if (!isNonEmptyString(phase) || !PHASES.includes(phase as Phase)) {
    return NextResponse.json(
      { error: `Missing or invalid field: phase (must be one of ${PHASES.join(', ')})` },
      { status: 400 }
    );
  }

  // 3. Resolve the caller's internal users row (id + property_id) via auth_id.
  //    staff_id references users(id), NOT auth.uid().
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, property_id')
    .eq('auth_id', user.id)
    .single();

  if (profileError || !profile?.property_id) {
    return NextResponse.json({ error: 'No property associated with this account' }, { status: 400 });
  }

  // 4. Upsert with ignoreDuplicates so repeat calls are no-ops. When the unique
  //    constraint is hit, the upsert returns no rows → already completed.
  const { data, error } = await supabase
    .from('lesson_completions')
    .upsert(
      {
        staff_id: profile.id,
        property_id: profile.property_id,
        module_id: module_id.trim(),
        lesson_id: lesson_id.trim(),
        phase,
      },
      { onConflict: 'staff_id,lesson_id,phase', ignoreDuplicates: true }
    )
    .select('id');

  if (error) {
    console.error('[lesson-completions] insert error:', error);
    return NextResponse.json({ error: 'Could not record completion' }, { status: 500 });
  }

  const already_completed = !data || data.length === 0;
  return NextResponse.json({ success: true, already_completed });
}
