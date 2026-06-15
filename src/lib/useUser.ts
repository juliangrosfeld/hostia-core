'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  auth_id: string
  property_id: string
  full_name: string
  email: string
  role: 'staff' | 'manager' | 'admin'
  xp: number
  streak_days: number
  last_active: string | null
}

export interface PropertyProfile {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [property, setProperty] = useState<PropertyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', session.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setLoading(false)
        return
      }

      if (profile) {
        setUser(profile)

        const { data: prop, error: propError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', profile.property_id)
          .single()

        if (propError) console.error('Property fetch error:', propError)
        if (prop) setProperty(prop)
      }

      setLoading(false)
    }

    load()
  }, [])

  return { user, property, loading }
}
