'use client'

import { useEffect, useState } from 'react'
import type { StaffMember } from '@/lib/staff-data'

export interface HomeProgress {
  isDemo: boolean
  started: boolean
  percent: number
  moduleTitle: string | null
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
  const [progress, setProgress] = useState<HomeProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (viewingAs) { setProgress(null); setLoading(false); return } // manager preview → mock copy
    let cancelled = false
    setLoading(true)
    fetch('/api/staff/home-progress')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) { setProgress(d ?? null); setLoading(false) } })
      .catch(() => { if (!cancelled) { setProgress(null); setLoading(false) } })
    return () => { cancelled = true }
  }, [viewingAs])

  return { progress, loading }
}
