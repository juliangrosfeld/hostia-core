// Shared streak math — the SINGLE definition used by both the staff hero
// (/api/staff/xp-streak) and the manager dashboard roster, so the number a
// staffer sees always matches what their manager sees.
//
// A streak = consecutive calendar days with at least one completion (lesson
// phase or roleplay), counted backward from today. A day with no activity YET
// today does not break the streak as long as yesterday had activity — only a
// fully missed day breaks it.
//
// Day boundaries are PROPERTY-LOCAL, not UTC. All current clients are in
// Curaçao (America/Curacao, UTC−4 year-round, no DST), so a fixed offset is
// exact — without it, anyone training after 20:00 local (00:00 UTC) had that
// session credited to the next calendar day, silently breaking evening-shift
// streaks. If clients in other timezones ever onboard, replace this constant
// with a per-property timezone (properties.timezone) resolved by the callers.

const DAY = 86_400_000;
const PROPERTY_UTC_OFFSET_MS = -4 * 3_600_000; // America/Curacao (UTC−4)

// Property-local calendar-day bucket for an epoch-ms timestamp.
function localDayOf(ms: number): number {
  return Math.floor((ms + PROPERTY_UTC_OFFSET_MS) / DAY);
}

// Property-local calendar-day bucket for an ISO timestamp.
export function activityDayIndex(iso: string): number {
  return localDayOf(Date.parse(iso));
}

export function computeStreak(
  activeDays: ReadonlySet<number>,
  now: number = Date.now(),
): number {
  const today = localDayOf(now);
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
