'use client';

import { useEffect, useState } from 'react';
import type { StaffMember } from '@/lib/staff-data';

// Demo property hero values. The demo signed-in staff user shows fixed mock
// numbers rather than live DB data — mirrors the mock StaffMember.xp (720) used
// elsewhere in the demo UI, with a plausible streak. Never queried live.
const DEMO_XP = 720;
const DEMO_STREAK = 5;

export interface StaffXPAndStreak {
  totalXp: number;
  streak: number;
  loading: boolean;
}

// Total earned XP + current activity streak for the staff hero banner.
//
//  • Manager "view as" preview (viewingAs set) → the mock staffer's own values.
//  • Demo property                             → fixed mock values (route returns
//                                                 isDemo, no live query).
//  • Real signed-in staff                      → live from /api/staff/xp-streak,
//    where totalXp = SUM(roleplay_sessions.xp_earned) over passed sessions — the
//    SAME source as the manager dashboard top-performer card.
export function useStaffXPAndStreak(viewingAs: StaffMember | null): StaffXPAndStreak {
  const [data, setData] = useState<{ totalXp: number; streak: number } | null>(null);

  useEffect(() => {
    if (viewingAs) return; // manager preview → use the mock staffer's values
    let cancelled = false;
    fetch('/api/staff/xp-streak')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        if (d.isDemo) setData({ totalXp: DEMO_XP, streak: DEMO_STREAK });
        else setData({ totalXp: d.totalXp ?? 0, streak: d.streak ?? 0 });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [viewingAs]);

  // Manager preview → the mock staffer carries its own xp/streak.
  if (viewingAs) {
    return { totalXp: viewingAs.xp, streak: viewingAs.streak, loading: false };
  }
  return {
    totalXp: data?.totalXp ?? 0,
    streak: data?.streak ?? 0,
    loading: data === null,
  };
}
