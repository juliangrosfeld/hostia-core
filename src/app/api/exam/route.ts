import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveCurriculum, type Phase } from '@/lib/curriculum';
import {
  fullyDoneByModule, isModuleComplete, orderedCurrentPhaseModules,
} from '@/lib/progress-model';
import { getExamConfig, gradeExam, type ExamAnswers } from '@/lib/exam';
import { LIMITS, enforceRateLimit, userSubject } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/exam — grade the signed-in staff member's phase certification exam.
//
// The client sends only raw answers; the exam content and grading live here so
// a submission can't self-report a score. The route independently verifies
// eligibility — every module of the staff member's CURRENT phase fully
// complete, via the same shared progress-model derivations the curriculum and
// dashboards use — then grades against the track's exam config. A pass writes
// the phase_completions row (through the session-bound client, so RLS applies),
// which is the single mechanism that flips the badge and unlocks the next
// phase. Deliberately NO XP: the exam's reward is the certification.
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { answers?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }
  if (!body.answers || typeof body.answers !== 'object') {
    return NextResponse.json({ error: 'Missing or invalid field: answers' }, { status: 400 });
  }

  // Rate limit — grading happens server-side, so unlimited submissions would
  // let a staffer converge on the answer key by resubmitting. Charged before
  // the eligibility queries, and per user rather than per IP so one restaurant's
  // shared connection can't throttle a whole team.
  const limited = await enforceRateLimit(LIMITS.examSubmitPerUser, userSubject(user.id));
  if (limited) return limited;

  const { data: profile } = await supabase
    .from('users')
    .select('id, property_id')
    .eq('auth_id', user.id)
    .single();
  if (!profile?.property_id) {
    return NextResponse.json({ error: 'No property associated with this account' }, { status: 400 });
  }
  const propertyId = profile.property_id as string;

  const admin = createAdminClient();
  const { data: prop } = await admin
    .from('properties')
    .select('venue_type')
    .eq('id', propertyId)
    .single();
  const track = (prop?.venue_type as string | null) ?? null;
  if (!track) {
    return NextResponse.json({ error: 'Property has no track configured' }, { status: 400 });
  }

  // The staff member's current phase = lowest phase without a completion row —
  // the exact rule the home view renders with.
  const [phasesRes, phaseCompletionRes, propertyModulesRes, completionRes] = await Promise.all([
    admin
      .from('phases')
      .select('id, track, phase_number, title, goal, outcome, certification_title, order_index')
      .eq('track', track)
      .order('phase_number', { ascending: true }),
    supabase.from('phase_completions').select('phase_id').eq('staff_id', profile.id),
    admin
      .from('property_modules')
      .select('module_id, order_index, is_active')
      .eq('property_id', propertyId)
      .order('order_index'),
    supabase
      .from('lesson_completions')
      .select('module_id, lesson_id, phase')
      .eq('property_id', propertyId)
      .eq('staff_id', profile.id),
  ]);

  const phases = (phasesRes.data ?? []) as Phase[];
  const completedPhaseIds = (phaseCompletionRes.data ?? []).map((r) => r.phase_id);
  const completedSet = new Set(completedPhaseIds);
  const currentPhase = phases.find((p) => !completedSet.has(p.id)) ?? null;
  if (!currentPhase) {
    return NextResponse.json({ error: 'All phases are already certified' }, { status: 400 });
  }

  const config = getExamConfig(track, currentPhase.phase_number);
  if (!config) {
    return NextResponse.json(
      { error: `No exam is available yet for ${track} phase ${currentPhase.phase_number}` },
      { status: 404 },
    );
  }

  // Eligibility: every content module of the current phase fully complete —
  // same shared derivations as /api/curriculum, so client and server can't
  // disagree about what "all modules done" means.
  const modules = resolveCurriculum(propertyModulesRes.data);
  const { data: mpaRows } = await admin
    .from('module_phase_assignments')
    .select('module_id, phase_id, order_in_phase')
    .in('module_id', modules.map((m) => m.id))
    .in('phase_id', phases.map((p) => p.id));

  const ordered = orderedCurrentPhaseModules({
    modules,
    phases,
    assignments: (mpaRows ?? []).map((r) => ({ ...r, order_in_phase: r.order_in_phase ?? null })),
    completedPhaseIds,
  });
  const doneByModule = fullyDoneByModule(completionRes.data ?? [], modules);
  const allComplete = ordered.length > 0 && ordered.every((m) => isModuleComplete(m, doneByModule));
  if (!allComplete) {
    return NextResponse.json(
      { error: `Complete all Phase ${currentPhase.phase_number} modules before taking the exam` },
      { status: 403 },
    );
  }

  // Grade server-side against the config. Missing/malformed round answers
  // simply score zero for that round — gradeExam tolerates partial shapes.
  const result = gradeExam(config, body.answers as ExamAnswers);

  if (result.passed) {
    // Session-bound client: RLS restricts the insert to the caller's own row.
    // ignoreDuplicates keeps a re-submit after a pass a no-op (the first
    // passing score stands — UNIQUE(staff_id, phase_id)).
    const { error } = await supabase
      .from('phase_completions')
      .upsert(
        {
          staff_id: profile.id,
          property_id: propertyId,
          phase_id: currentPhase.id,
          exam_score: result.overall,
        },
        { onConflict: 'staff_id,phase_id', ignoreDuplicates: true },
      );
    if (error) {
      console.error('[exam] phase_completions insert error:', error);
      return NextResponse.json({ error: 'Could not record certification' }, { status: 500 });
    }
  }

  return NextResponse.json({
    passed: result.passed,
    overall: result.overall,
    roundScores: result.roundScores,
    certificationTitle: currentPhase.certification_title,
  });
}
