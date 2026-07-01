'use client';

import { useEffect, useState } from 'react';

const EMPTY_KEYS: ReadonlySet<string> = new Set();

// The signed-in staff member's completed lessons, as a set of
// `${module_id}::${lesson_id}` keys. Completion uses the SAME definition as the
// module progress bars — a lesson counts as done once it has any
// lesson_completions row (learn, practice, or apply). See /api/lesson-completions.
//
// Skipped for a manager "view as" preview (enabled=false): the mock staffer's
// curriculum carries its own hardcoded lesson.status, so there's nothing to fetch.
export function useLessonCompletions(enabled: boolean): { completedKeys: ReadonlySet<string> } {
  const [fetched, setFetched] = useState<ReadonlySet<string>>(EMPTY_KEYS);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch('/api/lesson-completions')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.completed) return;
        setFetched(
          new Set(
            (d.completed as { module_id: string; lesson_id: string }[]).map(
              (c) => `${c.module_id}::${c.lesson_id}`,
            ),
          ),
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [enabled]);

  // When disabled (manager preview) always report empty, ignoring any stale fetch.
  return { completedKeys: enabled ? fetched : EMPTY_KEYS };
}

// Shared completion predicate. A lesson is complete when the real completion set
// has it, OR when the (demo/mock) curriculum already marks its status completed.
export function isLessonComplete(
  moduleId: string,
  lesson: { id: string; status: string },
  completedKeys: ReadonlySet<string>,
): boolean {
  return lesson.status === 'completed' || completedKeys.has(`${moduleId}::${lesson.id}`);
}
