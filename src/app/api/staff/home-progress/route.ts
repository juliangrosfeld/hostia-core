import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_PROPERTY_ID } from '@/lib/config';
import { resolveCurriculum, type Module } from '@/lib/curriculum';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: progress summary for the signed-in staff member's hero banner.
// Returns the first module they haven't fully finished and how far through it
// they are. Demo property short-circuits so the staff page keeps its mock copy.
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
    return NextResponse.json({ isDemo: false, started: false, percent: 0, moduleTitle: null });
  }

  if (profile.property_id === DEMO_PROPERTY_ID) {
    return NextResponse.json({ isDemo: true });
  }

  const admin = createAdminClient();
  const [completionRes, moduleRes] = await Promise.all([
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
  ]);

  const completions = completionRes.data ?? [];
  const modules: Module[] = resolveCurriculum(moduleRes.data);

  // Distinct completed lesson ids per module (any phase counts as "touched").
  const doneByModule = new Map<string, Set<string>>();
  for (const c of completions) {
    const set = doneByModule.get(c.module_id) ?? new Set<string>();
    set.add(c.lesson_id);
    doneByModule.set(c.module_id, set);
  }

  const learnable = modules.filter((m) => m.id !== 'phase-1-certification' && m.totalLessons > 0);
  const totalCompletions = completions.length;

  // First module that isn't fully complete = their current focus.
  const current =
    learnable.find((m) => (doneByModule.get(m.id)?.size ?? 0) < m.totalLessons) ?? learnable[0] ?? null;

  if (!current) {
    return NextResponse.json({ isDemo: false, started: false, percent: 0, moduleTitle: null });
  }

  const done = doneByModule.get(current.id)?.size ?? 0;
  const percent = current.totalLessons > 0 ? Math.min(100, Math.round((done / current.totalLessons) * 100)) : 0;

  return NextResponse.json({
    isDemo: false,
    started: totalCompletions > 0,
    percent,
    moduleTitle: current.title,
    firstModuleTitle: learnable[0]?.title ?? current.title,
  });
}
