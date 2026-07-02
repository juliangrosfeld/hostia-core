import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEMO_PROPERTY_ID } from '@/lib/config';
import { activityDayIndex, computeStreak } from '@/lib/streak';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: total earned XP + current activity streak for the signed-in staff member's
// hero banner.
//
// Total XP = SUM(roleplay_sessions.xp_earned) over PASSED sessions — the SAME
// source the manager dashboard's top-performer card uses (single source of truth).
// XP is always a computed value; it is never read from or written to users.xp.
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

  // Both reads go through the session-bound client — the staff self-read RLS
  // policies (auth_id-resolved, see fix_roleplay_sessions_staff_rls.sql) are
  // the security boundary, with the explicit staff_id/property_id filters as
  // defense in depth.
  const [sessionRes, completionRes] = await Promise.all([
    supabase
      .from('roleplay_sessions')
      .select('xp_earned, passed, completed_at')
      .eq('property_id', profile.property_id)
      .eq('staff_id', profile.id),
    supabase
      .from('lesson_completions')
      .select('completed_at')
      .eq('property_id', profile.property_id)
      .eq('staff_id', profile.id),
  ]);

  const sessions = sessionRes.data ?? [];
  const completions = completionRes.data ?? [];

  // Total XP — passed roleplay sessions only (xp_earned is 0 for fails anyway).
  const totalXp = sessions.reduce(
    (sum, s) => sum + (s.passed ? (s.xp_earned ?? 0) : 0),
    0,
  );

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
