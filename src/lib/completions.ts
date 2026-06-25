// Fire-and-forget client helper for logging that a staff member finished a
// lesson phase. Never throws and never blocks the UI — a failed log must not
// interrupt the learning flow. The server route is idempotent, so calling this
// more than once for the same phase is harmless.

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
  }).catch(() => {
    // Swallow — logging is best-effort.
  });
}
