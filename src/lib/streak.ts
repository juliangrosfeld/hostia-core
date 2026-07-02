// Shared streak math — the SINGLE definition used by both the staff hero
// (/api/staff/xp-streak) and the manager dashboard roster, so the number a
// staffer sees always matches what their manager sees.
//
// A streak = consecutive calendar days with at least one completion (lesson
// phase or roleplay), counted backward from today. A day with no activity YET
// today does not break the streak as long as yesterday had activity — only a
// fully missed day breaks it.
//
// NOTE: day boundaries are UTC for now. Audit fix 6 moves them to
// property-local time — in exactly one place: here.

const DAY = 86_400_000;

// Calendar-day bucket for an ISO timestamp.
export function activityDayIndex(iso: string): number {
  return Math.floor(Date.parse(iso) / DAY);
}

export function computeStreak(
  activeDays: ReadonlySet<number>,
  now: number = Date.now(),
): number {
  const today = Math.floor(now / DAY);
  // Start from today if it has activity; otherwise from yesterday so an
  // as-yet inactive today doesn't zero out an otherwise-live streak.
  const start = activeDays.has(today)
    ? today
    : activeDays.has(today - 1)
      ? today - 1
      : null;

  if (start === null) return 0;

  let streak = 0;
  for (let d = start; activeDays.has(d); d--) streak++;
  return streak;
}
