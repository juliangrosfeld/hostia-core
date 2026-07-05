import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_PROPERTY_ID } from '@/lib/config';
import { activityDayIndex, computeStreak } from '@/lib/streak';
import { resolveCurriculum } from '@/lib/curriculum';
import { computeTotalXp } from '@/lib/progress-model';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: total earned XP + current activity streak for the signed-in staff member's
// hero banner.
//
// Total XP comes from lib/progress-model.ts (roleplay XP over passed sessions
// + lesson XP per FULLY completed lesson — every phase done — with a warmth
// bonus on roleplay lessons, amounts resolved from the curriculum catalog) —
// the SAME derivation the manager dashboard uses, so hero and roster can
// never disagree. XP is always a computed value; it is never read from or
// written to users.xp. This endpoint serves managers too: a manager browsing
// the learning views sees their own XP/streak here, while the manager
// dashboard deliberately excludes manager activity from all staff-facing
// aggregates — the two pools never mix.
//
// Streak = number of consecutive calendar days (UTC) with at least one completion,
// counting backward from today across BOTH lesson_completions and roleplay_sessions.
// A day with no activity *yet today* does not break the streak as long as yesterday
// had activity — only a fully missed day breaks it.
//
// Demo property short-circuits with { isDemo: true } so the client keeps its mock
// values (mirrors /api/staff/home-progress).
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
    return NextResponse.json({ isDemo: false, totalXp: 0, streak: 0 });
  }

  if (profile.property_id === DEMO_PROPERTY_ID) {
    return NextResponse.json({ isDemo: true });
  }

  // Activity reads go through the session-bound client — the staff self-read
  // RLS policies (auth_id-resolved, see fix_roleplay_sessions_staff_rls.sql)
  // are the security boundary, with the explicit staff_id/property_id filters
  // as defense in depth. property_modules (non-sensitive config, needed to
  // resolve lesson XP amounts) is read with the admin client, mirroring
  // /api/curriculum.
  const admin = createAdminClient();
  const [sessionRes, completionRes, moduleRes] = await Promise.all([
    supabase
      .from('roleplay_sessions')
      .select('module_id, lesson_id, warmth_score, xp_earned, passed, completed_at')
      .eq('property_id', profile.property_id)
      .eq('staff_id', profile.id),
    supabase
      .from('lesson_completions')
      .select('module_id, lesson_id, phase, completed_at')
      .eq('property_id', profile.property_id)
      .eq('staff_id', profile.id),
    admin
      .from('property_modules')
      .select('module_id, order_index, is_active')
      .eq('property_id', profile.property_id)
      .order('order_index'),
  ]);

  const sessions = sessionRes.data ?? [];
  const completions = completionRes.data ?? [];

  // Total XP — roleplay + lesson XP via the shared model.
  const { totalXp } = computeTotalXp({
    sessions,
    completions,
    modules: resolveCurriculum(moduleRes.data),
  });

  // Streak — set of day-indices with any activity, walked backward from today.
  // Shared math with the manager dashboard roster (lib/streak.ts).
  const activeDays = new Set<number>();
  for (const s of sessions) {
    if (s.completed_at) activeDays.add(activityDayIndex(s.completed_at));
  }
  for (const c of completions) {
    if (c.completed_at) activeDays.add(activityDayIndex(c.completed_at));
  }

  return NextResponse.json({ isDemo: false, totalXp, streak: computeStreak(activeDays) });
}
