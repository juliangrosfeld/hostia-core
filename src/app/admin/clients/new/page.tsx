'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, AlertCircle, Upload, Loader2 } from 'lucide-react'

const VENUE_TYPES = [
  { value: 'casual-dining', label: 'Casual Dining' },
  { value: 'fine-dining', label: 'Fine Dining' },
  { value: 'fast-casual', label: 'Fast Casual' },
]

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

export default function NewClientPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [venueType, setVenueType] = useState('casual-dining')
  const [primaryColor, setPrimaryColor] = useState('#051956')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload-logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Failed to upload logo')
      } else {
        setLogoUrl(data.url)
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          venue_type: venueType,
          primary_color: primaryColor,
          logo_url: logoUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.id) {
        setError(data.error || 'Failed to create client')
        setSubmitting(false)
        return
      }
      router.push(`/admin/clients/${data.id}`)
    } catch {
      setError('Network error — please try again')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '36px 32px 80px' }}>
      <Link
        href="/admin"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          textDecoration: 'none',
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={15} /> Back to clients
      </Link>

      <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: 'var(--ocean-deep)', letterSpacing: '-0.02em' }}>
        New Client
      </h1>
      <p style={{ margin: '0 0 28px', fontSize: 14.5, color: 'var(--ink-soft)' }}>
        Create a new property. You can assign modules and configure overrides next.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'white',
          border: '1px solid var(--sand-deeper)',
          borderRadius: 18,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <div>
          <label htmlFor="name" style={labelStyle}>
            Property Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Brgr Haus"
            autoFocus
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sand-deeper)')}
          />
        </div>

        <div>
          <label htmlFor="venue" style={labelStyle}>
            Venue Type
          </label>
          <select
            id="venue"
            value={venueType}
            onChange={(e) => setVenueType(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {VENUE_TYPES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="color" style={labelStyle}>
            Primary Color
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              id="color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{
                width: 52,
                height: 44,
                border: '1px solid var(--sand-deeper)',
                borderRadius: 10,
                padding: 4,
                background: 'white',
                cursor: 'pointer',
              }}
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{ ...inputStyle, fontFamily: 'monospace', maxWidth: 160 }}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                border: '1px solid var(--sand-deeper)',
                background: logoUrl ? '#051956' : 'var(--sand-warm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo preview" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
              ) : (
                <Upload size={18} color="var(--ink-soft)" />
              )}
            </div>
            <label
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10,
                border: '1px solid var(--sand-deeper)', background: 'white',
                fontSize: 13.5, fontWeight: 700, color: 'var(--ink)',
                cursor: uploading ? 'default' : 'pointer',
              }}
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(224,122,95,0.08)',
              border: '1px solid rgba(224,122,95,0.25)',
              color: 'var(--coral-deep)',
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '13px 20px',
            borderRadius: 11,
            border: 'none',
            background: '#F5A623',
            color: '#051956',
            fontSize: 15,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: submitting || !name.trim() ? 'default' : 'pointer',
            opacity: submitting || !name.trim() ? 0.55 : 1,
          }}
        >
          <Check size={17} /> {submitting ? 'Creating…' : 'Create Client'}
        </button>
      </form>
    </div>
  )
}
