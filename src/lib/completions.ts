// Fire-and-forget client helpers for logging staff learning activity. They
// never throw and never block the UI — a failed log must not interrupt the
// learning flow.
//
// logLessonCompletion's server route is idempotent, so calling it more than
// once for the same phase is harmless.
//
// Both loggers bump the progress version on a successful write so the staff
// page's data hooks (completions, XP/streak, home progress) refetch and the
// UI updates without a reload.

import { bumpProgressVersion } from '@/lib/progress-refresh';

export type LessonPhase = 'learn' | 'practice' | 'apply';

export function logLessonCompletion(input: {
  module_id: string;
  lesson_id: string;
  phase: LessonPhase;
}): void {
  // Guard against missing ids — there's nothing useful to record without them.
  if (!input.module_id || !input.lesson_id) return;

  void fetch('/api/lesson-completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
    .then((res) => {
      if (res.ok) bumpProgressVersion();
    })
    .catch(() => {
      // Swallow — logging is best-effort.
    });
}

// One row per completed (passed or failed) Apply-phase roleplay. This is what
// feeds the staff hero XP, the manager dashboard's warmth metrics, and the
// admin activity counts. xp_earned is computed server-side from
// warmth_score + passed — it is intentionally NOT part of this payload.
// Sessions are not idempotent (each attempt is its own row), so the caller
// must guard against firing twice for the same run.
export function logRoleplaySession(input: {
  module_id: string;
  lesson_id: string;
  scenario_id: string;
  passed: boolean;
  warmth_score: number;
  turns: number;
  transcript: { role: 'user' | 'assistant'; content: string; warmth?: number }[];
}): void {
  if (!input.module_id || !input.lesson_id || !input.scenario_id) return;

  void fetch('/api/roleplay-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
    .then((res) => {
      if (res.ok) bumpProgressVersion();
    })
    .catch(() => {
      // Swallow — logging is best-effort.
    });
}
