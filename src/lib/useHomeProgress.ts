'use client'

import { useEffect, useState } from 'react'
import type { StaffMember } from '@/lib/staff-data'
import { useProgressVersion } from '@/lib/progress-refresh'

export interface HomeProgress {
  isDemo: boolean
  started: boolean
  percent: number
  moduleTitle: string | null
  moduleId?: string | null
  firstModuleTitle?: string | null
}

// Real-data progress for the hero banner. Fetched only for a real signed-in staff
// member — a manager "view as" preview keeps the mock copy, so we skip the request
// and report ready immediately. The staff page gates its first paint on `loading`
// so the hero renders its real/mock copy once, with no 50%-placeholder flicker.
export function useHomeProgress(viewingAs: StaffMember | null): {
  progress: HomeProgress | null
  loading: boolean
} {
  const [state, setState] = useState<{ progress: HomeProgress | null; loading: boolean }>({
    progress: null,
    loading: true,
  })
  // Bumped after every completion write → refetch, so the hero progress bar
  // and "continue" module stay current. The old progress is kept on screen
  // while the refetch is in flight (loading only gates the FIRST paint).
  const version = useProgressVersion()

  useEffect(() => {
    if (viewingAs) return
    let cancelled = false
    fetch('/api/staff/home-progress')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setState({ progress: d ?? null, loading: false }) })
      .catch(() => { if (!cancelled) setState({ progress: null, loading: false }) })
    return () => { cancelled = true }
  }, [viewingAs, version])

  // Manager preview → mock copy, ready immediately (derived, not set in the effect).
  if (viewingAs) return { progress: null, loading: false }
  return state
}
