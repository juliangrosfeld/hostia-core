import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_PROPERTY_ID } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY = 86_400_000;

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

  // roleplay_sessions: the staff self-read RLS policy still uses the broken
  // `staff_id = auth.uid()` pattern (only the manager policy was fixed), so the
  // authenticated client returns zero of the caller's OWN rows. Read it with the
  // admin client, scoped explicitly to the already-resolved profile.id +
  // property_id (safe: we've authenticated the caller and are only reading their
  // own data). lesson_completions RLS is correct, so it stays on the auth client.
  const admin = createAdminClient();
  const [sessionRes, completionRes] = await Promise.all([
    admin
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

  // Streak — set of UTC day-indices with any activity, walked backward from today.
  const activeDays = new Set<number>();
  for (const s of sessions) {
    if (s.completed_at) activeDays.add(Math.floor(Date.parse(s.completed_at) / DAY));
  }
  for (const c of completions) {
    if (c.completed_at) activeDays.add(Math.floor(Date.parse(c.completed_at) / DAY));
  }

  const todayNum = Math.floor(Date.now() / DAY);
  // Start from today if it has activity; otherwise from yesterday so an as-yet
  // inactive today doesn't zero out an otherwise-live streak. Neither → streak 0.
  const start = activeDays.has(todayNum)
    ? todayNum
    : activeDays.has(todayNum - 1)
      ? todayNum - 1
      : null;

  let streak = 0;
  if (start !== null) {
    for (let d = start; activeDays.has(d); d--) streak++;
  }

  return NextResponse.json({ isDemo: false, totalXp, streak });
}
