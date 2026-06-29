import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_PROPERTY_ID } from '@/lib/config';
import { resolveCurriculum, type Module, type Phase } from '@/lib/curriculum';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A resolved module enriched with this staff member's real progress + whether it
// is gated behind an earlier module in its phase.
interface ResolvedModule extends Module {
  locked: boolean;
  toBeCategorized?: boolean;
}

interface PhaseGroup {
  phase: Phase;
  modules: ResolvedModule[];
}

// GET: the property's module configuration, now grouped by phase.
//
// Back-compat: still returns `propertyModules` (the raw rows) so existing callers
// — useCurriculum() and the staff page navigation — keep working untouched.
//
// New: for a real (non-demo) signed-in staff member it also returns the curriculum
// grouped by phase, the unassigned ("to-be-categorized") modules, the property's
// track, and which phases the staff has already completed — so the client can
// render the phase-aware curriculum without doing the grouping itself.
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('id, property_id')
    .eq('auth_id', user.id)
    .single();

  // No property on the profile → no configuration; client falls back to full curriculum.
  if (!profile?.property_id) {
    return NextResponse.json({ propertyModules: [], isDemo: false, track: null, phases: [], unassigned: [], completedPhaseIds: [] });
  }

  const propertyId = profile.property_id as string;

  const admin = createAdminClient();
  const { data: propertyModules, error } = await admin
    .from('property_modules')
    .select('module_id, order_index, is_active')
    .eq('property_id', propertyId)
    .order('order_index');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // The property's track (venue_type maps 1:1 to track).
  const { data: prop } = await admin
    .from('properties')
    .select('venue_type')
    .eq('id', propertyId)
    .single();
  const track = (prop?.venue_type as string | null) ?? null;

  // Demo property → keep the exact existing payload shape. The staff page renders
  // its hardcoded mock layout for demo and never reads the phase fields.
  if (propertyId === DEMO_PROPERTY_ID) {
    return NextResponse.json({
      propertyModules: propertyModules ?? [],
      isDemo: true,
      track,
      phases: [],
      unassigned: [],
      completedPhaseIds: [],
    });
  }

  // ── Real staff path ────────────────────────────────────────────────────────
  // Resolve the property's curriculum from its module rows (content from CURRICULUM).
  const modules = resolveCurriculum(propertyModules);

  // resolveCurriculum returns Module objects from the hardcoded CURRICULUM array,
  // which don't carry the Supabase order_in_phase / phase_id values. Fetch those
  // from the modules table so phase grouping + ordering reflect the real DB state.
  const moduleIds = modules.map((m) => m.id);
  const { data: moduleRows } = await admin
    .from('modules')
    .select('id, phase_id, order_in_phase')
    .in('id', moduleIds);
  const moduleMetaMap = new Map(
    (moduleRows ?? []).map((r) => [r.id, { phase_id: r.phase_id, order_in_phase: r.order_in_phase }])
  );

  // This staff member's real completion data + the phases for their track.
  const [completionRes, phaseCompletionRes, phasesRes] = await Promise.all([
    supabase
      .from('lesson_completions')
      .select('module_id, lesson_id')
      .eq('property_id', propertyId)
      .eq('staff_id', profile.id),
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

  // Distinct completed lesson ids per module → real completedLessons count.
  const doneByModule = new Map<string, Set<string>>();
  for (const c of completionRes.data ?? []) {
    const set = doneByModule.get(c.module_id) ?? new Set<string>();
    set.add(c.lesson_id);
    doneByModule.set(c.module_id, set);
  }
  const completedCount = (m: Module): number =>
    Math.min(m.totalLessons, doneByModule.get(m.id)?.size ?? 0);
  const isComplete = (m: Module): boolean =>
    m.totalLessons > 0 && completedCount(m) >= m.totalLessons;

  const completedPhaseIds = (phaseCompletionRes.data ?? []).map((r) => r.phase_id);
  const phases = (phasesRes.data ?? []) as Phase[];

  // Split modules: those assigned to a phase vs. the not-yet-categorized rest.
  const assigned = modules.filter((m) => Boolean(moduleMetaMap.get(m.id)?.phase_id));
  const unassignedModules = modules.filter((m) => !moduleMetaMap.get(m.id)?.phase_id);

  // Build one group per phase (including phases with no modules yet, so the client
  // can render empty/locked future phases). Within a phase, modules go in
  // order_in_phase and each is locked until every earlier one is fully complete.
  const phaseGroups: PhaseGroup[] = phases.map((phase) => {
    const inPhase = assigned
      .filter((m) => moduleMetaMap.get(m.id)?.phase_id === phase.id)
      .sort((a, b) => {
        const aOrder = moduleMetaMap.get(a.id)?.order_in_phase ?? 999;
        const bOrder = moduleMetaMap.get(b.id)?.order_in_phase ?? 999;
        return aOrder - bOrder;
      });

    let priorComplete = true;
    const enriched: ResolvedModule[] = inPhase.map((m) => {
      const locked = !priorComplete;
      if (!isComplete(m)) priorComplete = false;
      return {
        ...m,
        phase_id: moduleMetaMap.get(m.id)?.phase_id,
        order_in_phase: moduleMetaMap.get(m.id)?.order_in_phase,
        completedLessons: completedCount(m),
        locked,
      };
    });

    return { phase, modules: enriched };
  });

  // Unassigned modules are surfaced (the client shows them under Phase 1 for now)
  // but flagged so they read as "to be categorized". Never gated.
  const unassigned: ResolvedModule[] = unassignedModules.map((m) => ({
    ...m,
    completedLessons: completedCount(m),
    locked: false,
    toBeCategorized: true,
  }));

  return NextResponse.json({
    propertyModules: propertyModules ?? [],
    isDemo: false,
    track,
    phases: phaseGroups,
    unassigned,
    completedPhaseIds,
  });
}
