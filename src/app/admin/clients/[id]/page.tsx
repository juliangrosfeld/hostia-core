'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Check, AlertCircle, Save, Plus, Trash2, Loader2,
} from 'lucide-react'
import { CURRICULUM } from '@/lib/curriculum'

const VENUE_TYPES = [
  { value: 'casual-dining', label: 'Casual Dining' },
  { value: 'fine-dining', label: 'Fine Dining' },
  { value: 'fast-casual', label: 'Fast Casual' },
]

// Overrides we always surface in the editor, even before they're set.
const DEFAULT_OVERRIDE_KEYS = ['property_name', 'scenario_context', 'manager_name']

// scenario_context gets a multiline textarea — it's the AI roleplay context.
const TEXTAREA_KEYS = new Set(['scenario_context'])

interface Property {
  id: string
  name: string
  venue_type: string | null
  primary_color: string | null
}
interface PropertyModule {
  module_id: string
  is_active: boolean
}
interface Override {
  key: string
  value: string
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
  padding: '11px 14px',
  fontSize: 15,
  fontFamily: 'inherit',
  color: 'var(--ink)',
  outline: 'none',
  background: 'white',
}
const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid var(--sand-deeper)',
  borderRadius: 18,
  padding: 26,
}
const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: 18,
  fontWeight: 800,
  color: 'var(--ocean-deep)',
  letterSpacing: '-0.01em',
}
const sectionSubStyle: React.CSSProperties = {
  margin: '0 0 20px',
  fontSize: 13.5,
  color: 'var(--ink-soft)',
}

function Toast({ tone, text }: { tone: 'ok' | 'err'; text: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color: tone === 'ok' ? 'var(--sage-deep)' : 'var(--coral-deep)',
      }}
    >
      {tone === 'ok' ? <Check size={15} /> : <AlertCircle size={15} />}
      {text}
    </div>
  )
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>()
  const propertyId = params.id

  const [property, setProperty] = useState<Property | null>(null)
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [overrides, setOverrides] = useState<Override[]>([])

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Per-area status messages.
  const [detailsMsg, setDetailsMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [moduleBusy, setModuleBusy] = useState<string | null>(null)
  const [overridesSaving, setOverridesSaving] = useState(false)
  const [overridesMsg, setOverridesMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  // ── Load ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/properties/${propertyId}`)
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled) setLoadError(data.error || 'Failed to load property')
          return
        }
        if (cancelled) return
        setProperty(data.property)
        setAssigned(new Set((data.propertyModules ?? []).map((m: PropertyModule) => m.module_id)))

        // Merge stored overrides with the default keys so they always appear.
        const stored: Override[] = (data.propertyOverrides ?? []).map((o: Override) => ({
          key: o.key,
          value: o.value,
        }))
        const storedKeys = new Set(stored.map((o) => o.key))
        const merged = [...stored]
        for (const key of DEFAULT_OVERRIDE_KEYS) {
          if (!storedKeys.has(key)) merged.push({ key, value: '' })
        }
        setOverrides(merged)
      } catch {
        if (!cancelled) setLoadError('Network error — please try again')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [propertyId])

  // ── Property field PATCH ──────────────────────────────────────
  async function patchField(field: string, value: string) {
    if (!property) return
    setProperty({ ...property, [field]: value })
    setDetailsMsg(null)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      const data = await res.json()
      setDetailsMsg(
        res.ok ? { tone: 'ok', text: 'Saved' } : { tone: 'err', text: data.error || 'Failed to save' }
      )
    } catch {
      setDetailsMsg({ tone: 'err', text: 'Network error' })
    }
  }

  // ── Module assign / unassign ──────────────────────────────────
  async function toggleModule(moduleId: string) {
    const isAssigned = assigned.has(moduleId)
    setModuleBusy(moduleId)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/modules`, {
        method: isAssigned ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId }),
      })
      if (res.ok) {
        setAssigned((prev) => {
          const next = new Set(prev)
          if (isAssigned) next.delete(moduleId)
          else next.add(moduleId)
          return next
        })
      }
    } catch {
      // leave the checkbox as-is on failure
    } finally {
      setModuleBusy(null)
    }
  }

  // ── Overrides ─────────────────────────────────────────────────
  function setOverrideValue(key: string, value: string) {
    setOverrides((prev) => prev.map((o) => (o.key === key ? { ...o, value } : o)))
    setOverridesMsg(null)
  }
  function updateOverrideKey(index: number, key: string) {
    setOverrides((prev) => prev.map((o, i) => (i === index ? { ...o, key } : o)))
    setOverridesMsg(null)
  }
  function addOverride() {
    setOverrides((prev) => [...prev, { key: '', value: '' }])
    setOverridesMsg(null)
  }
  function removeOverride(index: number) {
    setOverrides((prev) => prev.filter((_, i) => i !== index))
    setOverridesMsg(null)
  }

  async function saveOverrides() {
    setOverridesSaving(true)
    setOverridesMsg(null)
    const payload = overrides
      .map((o) => ({ key: o.key.trim(), value: o.value }))
      .filter((o) => o.key !== '')
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: payload }),
      })
      const data = await res.json()
      setOverridesMsg(
        res.ok ? { tone: 'ok', text: 'Overrides saved' } : { tone: 'err', text: data.error || 'Failed to save' }
      )
    } catch {
      setOverridesMsg({ tone: 'err', text: 'Network error — please try again' })
    } finally {
      setOverridesSaving(false)
    }
  }

  const assignedCount = useMemo(() => assigned.size, [assigned])

  // ── Render ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 15 }}>
        Loading property…
      </div>
    )
  }

  if (loadError || !property) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 32px' }}>
        <Link
          href="/admin"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', textDecoration: 'none', marginBottom: 20 }}
        >
          <ArrowLeft size={15} /> Back to clients
        </Link>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '20px 24px', borderRadius: 14,
            background: 'rgba(224,122,95,0.08)', border: '1px solid rgba(224,122,95,0.25)',
            color: 'var(--coral-deep)', fontSize: 15, fontWeight: 500,
          }}
        >
          <AlertCircle size={20} /> {loadError || 'Property not found'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 32px 80px' }}>
      <Link
        href="/admin"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', textDecoration: 'none', marginBottom: 18 }}
      >
        <ArrowLeft size={15} /> Back to clients
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 14, height: 14, borderRadius: 4, background: property.primary_color || '#051956', flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: 'var(--ocean-deep)', letterSpacing: '-0.02em' }}>
          {property.name}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── 1. Property Details ── */}
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
            <div>
              <h2 style={sectionTitleStyle}>Property Details</h2>
              <p style={{ ...sectionSubStyle, margin: 0 }}>Changes save automatically.</p>
            </div>
            {detailsMsg && <Toast tone={detailsMsg.tone} text={detailsMsg.text} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label htmlFor="p-name" style={labelStyle}>Property Name</label>
              <input
                id="p-name"
                type="text"
                value={property.name}
                onChange={(e) => setProperty({ ...property, name: e.target.value })}
                onBlur={(e) => patchField('name', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="p-venue" style={labelStyle}>Venue Type</label>
              <select
                id="p-venue"
                value={property.venue_type ?? ''}
                onChange={(e) => patchField('venue_type', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="" disabled>Select a venue type…</option>
                {VENUE_TYPES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="p-color" style={labelStyle}>Primary Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  id="p-color"
                  type="color"
                  value={property.primary_color || '#051956'}
                  onChange={(e) => patchField('primary_color', e.target.value)}
                  style={{ width: 52, height: 44, border: '1px solid var(--sand-deeper)', borderRadius: 10, padding: 4, background: 'white', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={property.primary_color || ''}
                  onChange={(e) => setProperty({ ...property, primary_color: e.target.value })}
                  onBlur={(e) => patchField('primary_color', e.target.value)}
                  style={{ ...inputStyle, fontFamily: 'monospace', maxWidth: 160 }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Module Library ── */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Module Library</h2>
          <p style={sectionSubStyle}>
            {assignedCount} of {CURRICULUM.length} modules assigned. Toggle to assign or remove.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CURRICULUM.map((m) => {
              const isAssigned = assigned.has(m.id)
              const busy = moduleBusy === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => !busy && toggleModule(m.id)}
                  disabled={busy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 12,
                    textAlign: 'left',
                    width: '100%',
                    cursor: busy ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    background: isAssigned ? 'rgba(245,166,35,0.06)' : 'white',
                    border: isAssigned ? '1.5px solid #F5A623' : '1px solid var(--sand-deeper)',
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isAssigned ? '#F5A623' : 'var(--sand-warm)',
                      border: isAssigned ? 'none' : '1px solid var(--sand-deeper)',
                      color: '#051956',
                    }}
                  >
                    {busy ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : isAssigned ? (
                      <Check size={14} />
                    ) : null}
                  </span>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--ocean-deep)' }}>
                      {m.title}
                    </span>
                    <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>
                      {m.subtitle}
                    </span>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {m.totalLessons} lessons
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── 3. Property Overrides ── */}
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <h2 style={sectionTitleStyle}>Property Overrides</h2>
            {overridesMsg && <Toast tone={overridesMsg.tone} text={overridesMsg.text} />}
          </div>
          <p style={sectionSubStyle}>
            Key/value config injected into the client&apos;s experience. <code>scenario_context</code> seeds
            the AI roleplay system prompt.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {overrides.map((o, i) => {
              const isDefault = DEFAULT_OVERRIDE_KEYS.includes(o.key)
              const isTextarea = TEXTAREA_KEYS.has(o.key)
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isDefault ? (
                      <label style={{ ...labelStyle, marginBottom: 0, flex: 1 }}>
                        {o.key.replace(/_/g, ' ')}
                      </label>
                    ) : (
                      <input
                        type="text"
                        value={o.key}
                        onChange={(e) => updateOverrideKey(i, e.target.value)}
                        placeholder="key"
                        style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: 13, padding: '8px 12px' }}
                      />
                    )}
                    {!isDefault && (
                      <button
                        onClick={() => removeOverride(i)}
                        title="Remove"
                        style={{
                          flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                          border: '1px solid var(--sand-deeper)', background: 'white',
                          color: 'var(--ink-soft)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  {isTextarea ? (
                    <textarea
                      value={o.value}
                      onChange={(e) => setOverrideValue(o.key, e.target.value)}
                      rows={4}
                      placeholder="This is Brgr Haus, a gourmet burger restaurant in Willemstad, Curaçao…"
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, minHeight: 96 }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={o.value}
                      onChange={(e) => setOverrideValue(o.key, e.target.value)}
                      style={inputStyle}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
            <button
              onClick={saveOverrides}
              disabled={overridesSaving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '11px 18px', borderRadius: 10, border: 'none',
                background: '#F5A623', color: '#051956',
                fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
                cursor: overridesSaving ? 'default' : 'pointer',
                opacity: overridesSaving ? 0.6 : 1,
              }}
            >
              <Save size={15} /> {overridesSaving ? 'Saving…' : 'Save overrides'}
            </button>
            <button
              onClick={addOverride}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '11px 16px', borderRadius: 10,
                border: '1px solid var(--sand-deeper)', background: 'white',
                color: 'var(--ocean-deep)', fontSize: 13.5, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Add key
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
