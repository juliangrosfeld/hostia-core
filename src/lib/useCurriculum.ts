'use client'

import { useEffect, useState } from 'react'
import { CURRICULUM, resolveCurriculum, type Module } from '@/lib/curriculum'

// Fetches the property's module configuration and rebuilds the staff curriculum
// from CURRICULUM content. Falls back to the full hardcoded curriculum if the
// property has no configuration or the request fails, so the staff page always
// renders something sensible.
export function useCurriculum() {
  const [curriculum, setCurriculum] = useState<Module[]>(CURRICULUM)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/curriculum')
        if (!res.ok) throw new Error('Failed to load curriculum')
        const data = await res.json()
        if (!cancelled) setCurriculum(resolveCurriculum(data.propertyModules))
      } catch {
        if (!cancelled) setCurriculum(CURRICULUM)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { curriculum, loading }
}
