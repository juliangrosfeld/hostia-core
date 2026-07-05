import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_PROPERTY_ID } from '@/lib/config';
import { resolveCurriculum, type Phase } from '@/lib/curriculum';
import {
  distinctDoneByModule, orderedCurrentPhaseModules, deriveCurrentModule,
} from '@/lib/progress-model';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: progress summary for the signed-in staff member's hero banner.
//
// "Current module" comes from lib/progress-model.ts: the first incomplete
// module in the SAME phase-aware display order the home grid renders
// (order_in_phase within the current phase, unassigned modules under phase 1,
// property_modules order when the property has no phases). The hero Continue
// CTA and the module grid therefore always point at the same module — the old
// property_modules.order_index walk here could disagree with the grid and
// even target a locked module. Demo property short-circuits so the staff page
// keeps its mock copy.
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('id, property_id')
    .eq('auth_id', user.id)
    .single();

  if (!profile?.property_id) {
    // No property → let the client fall back to its default copy.
    return NextResponse.json({ isDemo: false, started: false, percent: 0, moduleTitle: null, moduleId: null });
  }

  if (profile.property_id === DEMO_PROPERTY_ID) {
    return NextResponse.json({ isDemo: true });
  }

  const admin = createAdminClient();

  // Track drives which phases apply (mirrors /api/curriculum).
  const { data: prop } = await admin
    .from('properties')
    .select('venue_type')
    .eq('id', profile.property_id)
    .single();
  const track = (prop?.venue_type as string | null) ?? null;

  const [completionRes, moduleRes, phaseCompletionRes, phasesRes] = await Promise.all([
    supabase
      .from('lesson_completions')
      .select('module_id, lesson_id')
      .eq('property_id', profile.property_id)
      .eq('staff_id', profile.id),
    admin
      .from('property_modules')
      .select('module_id, order_index, is_active')
      .eq('property_id', profile.property_id)
      .order('order_index'),
    supabase
      .from('phase_completions')
      .select('phase_id')
      .eq('staff_id', profile.id),
    track
      ? admin
          .from('phases')
          .select('id, track, phase_number, title, goal, outcome, certification_title, order_index')
          .eq('track', track)
          .order('phase_number', { ascending: true })
      : Promise.resolve({ data: [] as Phase[] }),
  ]);

  const completions = completionRes.data ?? [];
  const modules = resolveCurriculum(moduleRes.data);
  const phases = (phasesRes.data ?? []) as Phase[];

  // Module→phase assignments for this track only (same filter as /api/curriculum,
  // so a universal module resolves to the right phase + order).
  const { data: mpaRows } = phases.length
    ? await admin
        .from('module_phase_assignments')
        .select('module_id, phase_id, order_in_phase')
        .in('module_id', modules.map((m) => m.id))
        .in('phase_id', phases.map((p) => p.id))
    : { data: [] };

  const doneByModule = distinctDoneByModule(completions);
  const ordered = orderedCurrentPhaseModules({
    modules,
    phases,
    assignments: (mpaRows ?? []).map((r) => ({ ...r, order_in_phase: r.order_in_phase ?? null })),
    completedPhaseIds: (phaseCompletionRes.data ?? []).map((r) => r.phase_id),
  });
  const current = deriveCurrentModule(ordered, doneByModule);

  if (!current) {
    // Everything in the current phase is complete (or no modules configured).
    return NextResponse.json({
      isDemo: false,
      started: completions.length > 0,
      percent: completions.length > 0 ? 100 : 0,
      moduleTitle: null,
      moduleId: null,
      firstModuleTitle: ordered[0]?.title ?? null,
    });
  }

  return NextResponse.json({
    isDemo: false,
    started: completions.length > 0,
    percent: current.percent,
    moduleTitle: current.module.title,
    // The id lets the hero's Continue button open this exact module.
    moduleId: current.module.id,
    firstModuleTitle: ordered[0]?.title ?? current.module.title,
  });
}
