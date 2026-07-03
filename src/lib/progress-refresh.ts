'use client';

import { useSyncExternalStore } from 'react';

// Tiny invalidation bus for the staff progress data. The completion loggers
// (lib/completions.ts) bump the version after a successful write; every hook
// that fetches progress-derived data (completed lessons, hero XP/streak, home
// progress) subscribes via useProgressVersion() and refetches on a bump. This
// is what keeps "Completed" badges and hero XP live without a page reload.
let version = 0;
const listeners = new Set<() => void>();

export function bumpProgressVersion(): void {
  version += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): number {
  return version;
}

// Include the returned version in a data-fetching effect's dependency array to
// refetch whenever a completion/session write lands.
export function useProgressVersion(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
