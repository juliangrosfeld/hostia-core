import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateRoleplayXP } from '@/lib/xp';
import { gradeRoleplay, MAX_TURNS } from '@/lib/roleplay-grading';
import { hashProofToken, verifyProofChain } from '@/lib/roleplay-proof';
import { LIMITS, enforceRateLimit, userSubject } from '@/lib/rate-limit';

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
// GRADING TRUST MODEL: the client must submit the session's HMAC proof chain
// (one proof per turn, signed by /api/roleplay); passed / warmth_score /
// turns / xp_earned are ALL derived server-side from the verified per-turn
// warmth values — the client-sent grade is advisory only. A session without
// a chain is rejected outright (rollout settled 2026-07-11: every deployed
// client sends proofs, so a missing chain is either tampering or a
// misconfigured deployment losing ROLEPLAY_PROOF_SECRET — both must fail
// loudly, not land as unverified rows). Inserts use the standard
// session-bound client so RLS ("Staff can insert own sessions",
// auth_id-resolved) enforces that staff can only write their own rows.
export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Must be a logged-in user.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1b. Rate limit — bounded by how fast roleplays can legitimately finish, so
  // a client loop (or a script) can't flood the table with session rows.
  const limited = await enforceRateLimit(LIMITS.roleplaySessionPerUser, userSubject(user.id));
  if (limited) return limited;

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

  // 4. Verify the proof chain and derive the grade server-side. The chain is
  //    mandatory — a session without one is rejected, never stored.
  const proofsRaw = body.proofs;
  if (proofsRaw !== undefined && proofsRaw !== null &&
      (!Array.isArray(proofsRaw) || proofsRaw.some((p) => typeof p !== 'string'))) {
    return NextResponse.json({ error: 'Invalid field: proofs' }, { status: 400 });
  }
  const proofs = (proofsRaw ?? []) as string[];
  if (proofs.length === 0) {
    console.warn('[roleplay-sessions] REJECTED session without proof chain for staff', profile.id);
    return NextResponse.json(
      { error: 'Session verification failed: missing proof chain' },
      { status: 400 }
    );
  }

  const result = verifyProofChain({
    proofs,
    authId: user.id,
    scenarioId: scenario_id.trim(),
    maxTurns: MAX_TURNS,
  });
  if ('error' in result) {
    console.warn('[roleplay-sessions] proof verification FAILED:', result.error);
    return NextResponse.json(
      { error: `Session verification failed: ${result.error}` },
      { status: 400 }
    );
  }

  const graded = gradeRoleplay(result.warmths);

  // Terminal check: a session is only ever logged when it ended — either
  // passed, or failed at MAX_TURNS. A chain that is neither is a truncated
  // prefix (bad final turns dropped to inflate the average) — reject it.
  if (!graded.passed && result.warmths.length < MAX_TURNS) {
    console.warn('[roleplay-sessions] proof chain ends before a terminal state — rejected');
    return NextResponse.json(
      { error: 'Session verification failed: incomplete session' },
      { status: 400 }
    );
  }

  if (
    graded.passed !== passed ||
    graded.warmthScore !== warmth_score ||
    result.warmths.length !== turns
  ) {
    // Shouldn't happen with an honest client (same grading lib both sides)
    // — worth a log line either way. The derived values win regardless.
    console.warn('[roleplay-sessions] client grade differed from server derivation:', {
      client: { passed, warmth_score, turns },
      derived: { passed: graded.passed, warmth_score: graded.warmthScore, turns: result.warmths.length },
    });
  }
  const finalPassed = graded.passed;
  const finalWarmthScore = graded.warmthScore;
  const finalTurns = result.warmths.length;
  const verified = true;
  // Unique per chain (DB-enforced) — a replayed chain can't create a second row.
  const proof_chain_hash = hashProofToken(proofs[proofs.length - 1]);

  // 5. XP is a server-side derivation of the performance signal — never the
  //    client's number (xp.ts is the single source of the tier table).
  const xp_earned = calculateRoleplayXP(finalWarmthScore, finalPassed);

  const { data, error } = await supabase
    .from('roleplay_sessions')
    .insert({
      staff_id: profile.id,
      property_id: profile.property_id,
      module_id: module_id.trim(),
      lesson_id: lesson_id.trim(),
      scenario_id: scenario_id.trim(),
      passed: finalPassed,
      warmth_score: finalWarmthScore,
      xp_earned,
      turns: finalTurns,
      transcript,
      verified,
      proof_chain_hash,
    })
    .select('id')
    .single();

  if (error) {
    // Unique violation on proof_chain_hash → this exact chain was already
    // redeemed. Not a server fault: report it as a duplicate.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Session already recorded' }, { status: 409 });
    }
    console.error('[roleplay-sessions] insert error:', error);
    return NextResponse.json({ error: 'Could not record session' }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id, xp_earned, verified });
}
