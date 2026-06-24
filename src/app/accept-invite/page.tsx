'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, AlertCircle, Loader2, Lock } from 'lucide-react'

interface InviteDetails {
  email: string
  full_name: string
  property_name: string
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--ink-soft)',
  marginBottom: 8,
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--sand-deeper)',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  fontFamily: 'inherit',
  color: 'var(--ink)',
  outline: 'none',
  background: 'white',
}

export default function AcceptInvitePage() {
  const router = useRouter()

  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Read the token from the URL on mount (avoids a Suspense boundary for
  // useSearchParams) and validate it against the public API.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token')
    if (!t) {
      setStatus('invalid')
      setLoadError('No invite token was provided.')
      return
    }
    setToken(t)
    ;(async () => {
      try {
        const res = await fetch(`/api/accept-invite?token=${encodeURIComponent(t)}`)
        const data = await res.json()
        if (!res.ok || !data.valid) {
          setStatus('invalid')
          setLoadError(data.error || 'This invite is no longer valid.')
          return
        }
        setInvite(data.invite)
        setStatus('valid')
      } catch {
        setStatus('invalid')
        setLoadError('Network error — please try again.')
      }
    })()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || !token) return

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Could not complete setup.')
        setSubmitting(false)
        return
      }
      router.push('/login?welcome=manager')
    } catch {
      setFormError('Network error — please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--sand)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
            }}
          >
            Hostia
          </div>
          <div style={{ marginTop: 4, height: 3, width: 40, borderRadius: 2, background: '#F5A623', margin: '6px auto 0' }} />
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid var(--sand-deeper)',
            borderRadius: 18,
            padding: 30,
            boxShadow: '0 12px 40px -18px rgba(5,25,86,0.35)',
          }}
        >
          {status === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '32px 0', color: 'var(--ink-soft)', fontSize: 15 }}>
              <Loader2 size={18} className="animate-spin" /> Validating your invite…
            </div>
          )}

          {status === 'invalid' && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(224,122,95,0.12)', color: 'var(--coral-deep)',
                }}
              >
                <AlertCircle size={24} />
              </div>
              <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: 'var(--ocean-deep)' }}>
                Invite unavailable
              </h1>
              <p style={{ margin: 0, fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                {loadError || 'This invite is invalid or has expired.'}
              </p>
              <p style={{ margin: '18px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                Ask your administrator to send a fresh invite.
              </p>
            </div>
          )}

          {status === 'valid' && invite && (
            <form onSubmit={handleSubmit}>
              <h1 style={{ margin: '0 0 8px', fontSize: 23, fontWeight: 800, color: 'var(--ocean-deep)', letterSpacing: '-0.01em' }}>
                Welcome to Hostia, {invite.full_name.split(' ')[0]}.
              </h1>
              <p style={{ margin: '0 0 24px', fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                You&apos;re being invited to manage <b style={{ color: 'var(--ocean-deep)' }}>{invite.property_name}</b>.
                Set a password to continue.
              </p>

              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 10, marginBottom: 20,
                  background: 'var(--sand)', border: '1px solid var(--sand-deeper)',
                  fontSize: 13.5, color: 'var(--ink-soft)',
                }}
              >
                <Lock size={14} /> Signing in as <b style={{ color: 'var(--ocean-deep)' }}>{invite.email}</b>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                <div>
                  <label htmlFor="pw" style={labelStyle}>Password</label>
                  <input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="pw2" style={labelStyle}>Confirm Password</label>
                  <input
                    id="pw2"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    style={inputStyle}
                  />
                </div>
              </div>

              {formError && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16,
                    fontSize: 13, fontWeight: 600, color: 'var(--coral-deep)',
                  }}
                >
                  <AlertCircle size={15} /> {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', display: 'inline-flex', alignItems: 'center',
                  justifyContent: 'center', gap: 7,
                  padding: '13px 18px', borderRadius: 10, border: 'none',
                  background: '#F5A623', color: '#051956',
                  fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
                  cursor: submitting ? 'default' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  boxShadow: '0 4px 14px rgba(245,166,35,0.35)',
                }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {submitting ? 'Setting up your account…' : 'Set password & continue'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12.5, color: 'var(--ink-soft)' }}>
          Hospitality training, powered by Hostia.
        </p>
      </div>
    </div>
  )
}
