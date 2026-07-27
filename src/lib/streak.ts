// Shared streak math — the SINGLE definition used by both the staff hero
// (/api/staff/xp-streak) and the manager dashboard roster, so the number a
// staffer sees always matches what their manager sees.
//
// A streak = consecutive calendar days on which the staff member EARNED a day,
// counted backward from today. A day is earned by either:
//   • completing a NEW lesson — a lesson reaching FULL completion that day
//     (every phase it has; apply only ever lands on a passed roleplay), pinned
//     in time by progress-model.ts's fullCompletionTimes; or
//   • passing a phase certification exam that day (phase_completions).
//
// What deliberately does NOT earn a day:
//   • Re-doing a lesson that was already complete. This needs no filtering —
//     lesson_completions is UNIQUE(staff_id, lesson_id, phase) and the write
//     path upserts with ignoreDuplicates, so a repeat writes no row and the
//     original completed_at never moves.
//   • Roleplay on its own. Re-running an already-passed scenario writes a
//     roleplay_sessions row but no completion row; roleplay_sessions is
//     therefore NOT a streak input at all. A first-ever PASS still earns the
//     day, because it writes the apply row that completes the lesson.
//   • Partial progress — starting a lesson (learn/practice) without finishing
//     it. Full completion is the app-wide completion definition; the streak
//     uses it too rather than reintroducing "any phase row counts".
//
// A day with no activity YET today does not break the streak as long as
// yesterday earned one — only a fully missed day breaks it. (This is the
// deliberate reading of "24 hours without a new lesson resets the streak":
// calendar days with grace, not a rolling 24h window that would kill a streak
// at whatever clock time the staffer happened to train at yesterday.)
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
export function dayIndexOf(ms: number): number {
  return Math.floor((ms + PROPERTY_UTC_OFFSET_MS) / DAY);
}

// Property-local calendar-day bucket for an ISO timestamp.
export function activityDayIndex(iso: string): number {
  return dayIndexOf(Date.parse(iso));
}

// `earnedDays` — day indices that earned a streak day (see the rule above).
export function computeStreak(
  earnedDays: ReadonlySet<number>,
  now: number = Date.now(),
): number {
  const today = dayIndexOf(now);
  // Start from today if it has been earned; otherwise from yesterday so an
  // as-yet unearned today doesn't zero out an otherwise-live streak.
  const start = earnedDays.has(today)
    ? today
    : earnedDays.has(today - 1)
      ? today - 1
      : null;

  if (start === null) return 0;

  let streak = 0;
  for (let d = start; earnedDays.has(d); d--) streak++;
  return streak;
}
