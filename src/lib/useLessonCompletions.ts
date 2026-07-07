'use client';

import { useEffect, useState } from 'react';
import { useProgressVersion } from '@/lib/progress-refresh';

const EMPTY_KEYS: ReadonlySet<string> = new Set();

export const lessonKey = (moduleId: string, lessonId: string) => `${moduleId}::${lessonId}`;

interface CompletionSets {
  completedKeys: ReadonlySet<string>;
  startedKeys: ReadonlySet<string>;
}

const EMPTY_SETS: CompletionSets = { completedKeys: EMPTY_KEYS, startedKeys: EMPTY_KEYS };

// The signed-in staff member's lesson state, as sets of
// `${module_id}::${lesson_id}` keys:
//  • completedKeys — FULLY completed lessons, the SAME definition as the module
//    progress bars: every phase the lesson has is done (learn + practice, plus
//    a PASSED roleplay for apply lessons). See /api/lesson-completions and
//    lib/progress-model.ts.
//  • startedKeys — lessons with at least one phase done but not fully
//    complete. Drives the "Continue" emphasis; a lesson in neither set is
//    untouched.
//
// Skipped for a manager "view as" preview (enabled=false): the mock staffer's
// curriculum carries its own hardcoded lesson.status, so there's nothing to fetch.
export function useLessonCompletions(enabled: boolean): CompletionSets {
  const [fetched, setFetched] = useState<CompletionSets>(EMPTY_SETS);
  // Bumped after every successful completion write → refetch, so a finished
  // lesson shows as Completed immediately (no page reload needed).
  const version = useProgressVersion();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch('/api/lesson-completions')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.completed) return;
        const toKeys = (rows: { module_id: string; lesson_id: string }[] | undefined) =>
          new Set((rows ?? []).map((c) => lessonKey(c.module_id, c.lesson_id)));
        setFetched({
          completedKeys: toKeys(d.completed),
          startedKeys: toKeys(d.started),
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [enabled, version]);

  // When disabled (manager preview) always report empty, ignoring any stale fetch.
  return enabled ? fetched : EMPTY_SETS;
}

// Shared completion predicate. A lesson is complete when the real completion
// set has it — or, ONLY in mock contexts (manager "view as" preview, the demo
// property), when the hardcoded curriculum status says so. Real accounts must
// never inherit the demo's preview state, so trustMockStatus is required and
// callers pass it explicitly.
export function isLessonComplete(
  moduleId: string,
  lesson: { id: string; status: string },
  completedKeys: ReadonlySet<string>,
  trustMockStatus: boolean,
): boolean {
  if (completedKeys.has(lessonKey(moduleId, lesson.id))) return true;
  return trustMockStatus && lesson.status === 'completed';
}
