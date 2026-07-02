import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateRoleplayXP } from '@/lib/xp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Transcript rows are stored as-is in the JSONB column; cap them so a hostile
// client can't stuff megabytes into a single session row.
const MAX_TRANSCRIPT_ENTRIES = 40;
const MAX_TRANSCRIPT_CONTENT = 2000;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  warmth?: number;
}

// Validate + normalize the transcript payload. Anything malformed is dropped
// rather than rejected — the transcript is supporting evidence, not the record
// of truth (that's warmth_score/passed), so a partial transcript beats a lost
// session.
function sanitizeTranscript(v: unknown): TranscriptEntry[] {
  if (!Array.isArray(v)) return [];
  const out: TranscriptEntry[] = [];
  for (const entry of v.slice(0, MAX_TRANSCRIPT_ENTRIES)) {
    if (!entry || typeof entry !== 'object') continue;
    const { role, content, warmth } = entry as Record<string, unknown>;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string' || !content.trim()) continue;
    const row: TranscriptEntry = { role, content: content.slice(0, MAX_TRANSCRIPT_CONTENT) };
    if (typeof warmth === 'number' && Number.isFinite(warmth)) row.warmth = warmth;
    out.push(row);
  }
  return out;
}

// POST: record one completed (passed OR failed) Apply-phase roleplay for the
// signed-in staff member. This is the missing write half of the XP pipeline:
// /api/staff/xp-streak and the manager dashboard both read this table.
//
// xp_earned is recomputed HERE from warmth_score + passed — the client's
// display value is never trusted. Inserts use the standard session-bound
// client so RLS ("Staff can insert own sessions", auth_id-resolved) enforces
// that staff can only write their own rows.
export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Must be a logged-in user.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse + validate the body.
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const { module_id, lesson_id, scenario_id, passed, warmth_score, turns } = body;

  if (!isNonEmptyString(module_id)) {
    return NextResponse.json({ error: 'Missing or invalid field: module_id' }, { status: 400 });
  }
  if (!isNonEmptyString(lesson_id)) {
    return NextResponse.json({ error: 'Missing or invalid field: lesson_id' }, { status: 400 });
  }
  if (!isNonEmptyString(scenario_id)) {
    return NextResponse.json({ error: 'Missing or invalid field: scenario_id' }, { status: 400 });
  }
  if (typeof passed !== 'boolean') {
    return NextResponse.json({ error: 'Missing or invalid field: passed (must be boolean)' }, { status: 400 });
  }
  if (
    typeof warmth_score !== 'number' ||
    !Number.isInteger(warmth_score) ||
    warmth_score < 0 ||
    warmth_score > 100
  ) {
    return NextResponse.json(
      { error: 'Missing or invalid field: warmth_score (integer 0–100)' },
      { status: 400 }
    );
  }
  if (typeof turns !== 'number' || !Number.isInteger(turns) || turns < 1 || turns > 50) {
    return NextResponse.json(
      { error: 'Missing or invalid field: turns (integer 1–50)' },
      { status: 400 }
    );
  }

  const transcript = sanitizeTranscript(body.transcript);

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

  // 4. XP is a server-side derivation of the performance signal — never the
  //    client's number (xp.ts is the single source of the tier table).
  const xp_earned = calculateRoleplayXP(warmth_score, passed);

  const { data, error } = await supabase
    .from('roleplay_sessions')
    .insert({
      staff_id: profile.id,
      property_id: profile.property_id,
      module_id: module_id.trim(),
      lesson_id: lesson_id.trim(),
      scenario_id: scenario_id.trim(),
      passed,
      warmth_score,
      xp_earned,
      turns,
      transcript,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[roleplay-sessions] insert error:', error);
    return NextResponse.json({ error: 'Could not record session' }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id, xp_earned });
}
