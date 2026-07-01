'use client'

import { useEffect, useState } from 'react'
import { CURRICULUM, resolveCurriculum, type Module, type Phase } from '@/lib/curriculum'

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

// Fetches the property's module configuration ONCE and returns both the resolved
// staff curriculum (rebuilt from CURRICULUM content) and the phase-grouped payload
// the home view needs for its phase-aware layout. Serving both from a single
// request means the staff page can gate its first paint on this data — no second
// /api/curriculum call from HomeView, and no fallback-then-real layout flicker.
//
// Falls back to the full hardcoded curriculum (and null phaseData) if the property
// has no configuration or the request fails, so the staff page always renders
// something sensible.
export function useCurriculum() {
  const [curriculum, setCurriculum] = useState<Module[]>(CURRICULUM)
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null)
  const [loading, setLoading] = useState(true)

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
        if (!cancelled) { setCurriculum(CURRICULUM); setPhaseData(null) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { curriculum, phaseData, loading }
}
