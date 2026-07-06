'use client'

import { useEffect, useState } from 'react'
import { CURRICULUM, resolveCurriculum, type Module, type Phase } from '@/lib/curriculum'
import { useProgressVersion } from '@/lib/progress-refresh'

// A resolved module plus the gating/categorization flags from /api/curriculum.
export type ResolvedModule = Module & { locked: boolean; toBeCategorized?: boolean }
export interface PhaseGroup { phase: Phase; modules: ResolvedModule[] }
export interface PhaseData {
  isDemo: boolean
  track: string | null
  phases: PhaseGroup[]
  unassigned: ResolvedModule[]
  completedPhaseIds: string[]
}

// Fetches the property's module configuration and returns both the resolved
// staff curriculum (rebuilt from CURRICULUM content) and the phase-grouped payload
// the home view needs for its phase-aware layout. Serving both from a single
// request means the staff page can gate its first paint on this data — no second
// /api/curriculum call from HomeView, and no fallback-then-real layout flicker.
//
// Refetches on every progress-version bump so the module cards' completed
// counts, lock states and phase progress stay in step with the completion set
// (useLessonCompletions) after a lesson finishes — no reload needed. Only the
// initial load gates rendering; refreshes swap the data in place.
//
// Falls back to the full hardcoded curriculum (and null phaseData) if the property
// has no configuration or the request fails, so the staff page always renders
// something sensible.
export function useCurriculum() {
  const [curriculum, setCurriculum] = useState<Module[]>(CURRICULUM)
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null)
  const [loading, setLoading] = useState(true)
  // Bumped after every successful completion write → refetch. `loading` is
  // only ever set false, so a refresh never re-gates the page paint.
  const version = useProgressVersion()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/curriculum')
        if (!res.ok) throw new Error('Failed to load curriculum')
        const data = await res.json()
        if (!cancelled) {
          setCurriculum(resolveCurriculum(data.propertyModules))
          setPhaseData(data as PhaseData)
        }
      } catch {
        // Keep whatever we have: on first load that's already the CURRICULUM
        // fallback (the useState defaults); on a version-bump refresh it's the
        // last good data — never downgrade a live page to the fallback.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [version])

  return { curriculum, phaseData, loading }
}
