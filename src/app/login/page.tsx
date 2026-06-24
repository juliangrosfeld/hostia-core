'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [welcome, setWelcome] = useState(false)
  const router = useRouter()

  // Managers who just accepted an invite land here with ?welcome=manager.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('welcome') === 'manager') {
      setWelcome(true)
    }
  }, [])

  async function handleLogin() {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Auth result:', { data, error })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/staff')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#C8A97A] tracking-tight">Hostia</h1>
          <p className="text-[#888] mt-2 text-sm">Hospitality Training Platform</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8">
          <h2 className="text-white text-xl font-semibold mb-6">Sign in to your account</h2>
          {welcome && (
            <div className="mb-5 rounded-xl border border-[#C8A97A]/40 bg-[#C8A97A]/10 px-4 py-3 text-sm text-[#D4B88A]">
              Your account is ready — sign in with your email and new password to get started.
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-[#888] text-sm mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:outline-none focus:border-[#C8A97A] transition-colors"
              />
            </div>
            <div>
              <label className="text-[#888] text-sm mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:outline-none focus:border-[#C8A97A] transition-colors"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#C8A97A] hover:bg-[#D4B88A] disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </div>
        <p className="text-center text-[#444] text-xs mt-6">Don't have an account? Contact your manager.</p>
      </div>
    </div>
  )
}
