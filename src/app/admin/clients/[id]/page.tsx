'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Check, AlertCircle, Save, Plus, Trash2, Loader2,
  UserPlus, Copy, Mail, X, Upload,
} from 'lucide-react'
import { CURRICULUM, type Phase } from '@/lib/curriculum'

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
  logo_url: string | null
}
interface PropertyModule {
  module_id: string
  is_active: boolean
}
interface Override {
  key: string
  value: string
}
interface Manager {
  id: string
  full_name: string
  email: string
}
interface PendingInvite {
  id: string
  email: string
  full_name: string
  invite_link: string
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

// Unambiguous destructive red for delete surfaces.
const DANGER_RED = '#d64545'

// Reusable "type to confirm" deletion modal. The destructive button stays
// disabled until the typed text matches `expected`. ESC and backdrop click
// cancel (unless a delete is in flight). onConfirm does the actual work and
// returns true on success (parent unmounts the modal) or false on failure
// (modal stays open so the user can retry).
function ConfirmDeleteModal({
  title,
  warning,
  inputLabel,
  placeholder,
  expected,
  caseInsensitive = false,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  warning: React.ReactNode
  inputLabel: string
  placeholder: string
  expected: string
  caseInsensitive?: boolean
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => Promise<boolean>
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  const matches = caseInsensitive
    ? text.trim().toLowerCase() === expected.trim().toLowerCase()
    : text === expected

  async function handleConfirm() {
    if (!matches || busy) return
    setBusy(true)
    const ok = await onConfirm()
    if (!ok) setBusy(false)
  }

  return (
    <div
      onClick={() => { if (!busy) onCancel() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(5,25,86,0.32)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, background: 'white',
          borderRadius: 18, border: `1px solid ${DANGER_RED}`,
          boxShadow: '0 24px 60px -20px rgba(5,25,86,0.45)', padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <h2 style={{ ...sectionTitleStyle, color: DANGER_RED }}>{title}</h2>
          <button
            onClick={() => { if (!busy) onCancel() }}
            title="Close"
            disabled={busy}
            style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--sand-deeper)', background: 'white',
              color: 'var(--ink-soft)', cursor: busy ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink)', margin: '0 0 20px' }}>
          {warning}
        </p>

        <label style={labelStyle}>{inputLabel}</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          autoFocus
          disabled={busy}
          style={{ ...inputStyle, marginBottom: 20 }}
        />

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { if (!busy) onCancel() }}
            disabled={busy}
            style={{
              flex: 1, padding: '11px 18px', borderRadius: 10,
              border: '1px solid var(--sand-deeper)', background: 'var(--sand)',
              color: 'var(--ink)', fontSize: 14, fontWeight: 700,
              fontFamily: 'inherit', cursor: busy ? 'default' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!matches || busy}
            style={{
              flex: 1, display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', gap: 7,
              padding: '11px 18px', borderRadius: 10, border: 'none',
              background: DANGER_RED, color: 'white',
              fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
              cursor: !matches || busy ? 'default' : 'pointer',
              opacity: !matches || busy ? 0.5 : 1,
            }}
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
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
  const router = useRouter()
  const propertyId = params.id

  // Floating page-level toast for the destructive actions.
  const [pageToast, setPageToast] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const showToast = useCallback((tone: 'ok' | 'err', text: string) => {
    setPageToast({ tone, text })
    setTimeout(() => setPageToast(null), tone === 'ok' ? 3000 : 5000)
  }, [])

  // Delete flows.
  const [deletePropertyOpen, setDeletePropertyOpen] = useState(false)
  const [deleteManagerTarget, setDeleteManagerTarget] = useState<Manager | null>(null)

  const [property, setProperty] = useState<Property | null>(null)
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [overrides, setOverrides] = useState<Override[]>([])
  const [phases, setPhases] = useState<Phase[]>([])

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Per-area status messages.
  const [detailsMsg, setDetailsMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [moduleBusy, setModuleBusy] = useState<string | null>(null)
  const [overridesSaving, setOverridesSaving] = useState(false)
  const [overridesMsg, setOverridesMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  // ── Managers ──────────────────────────────────────────────────
  const [managers, setManagers] = useState<Manager[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [managersLoading, setManagersLoading] = useState(true)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(link)
      setTimeout(() => setCopiedLink((cur) => (cur === link ? null : cur)), 2000)
    } catch {
      // Clipboard blocked — the link stays visible for a manual copy.
    }
  }

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

  // ── Load managers + pending invites ───────────────────────────
  const loadManagers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/managers`)
      const data = await res.json()
      if (res.ok) {
        setManagers(data.managers ?? [])
        setPendingInvites(data.pendingInvites ?? [])
      }
    } catch {
      // Non-fatal — the section just shows empty until a retry.
    } finally {
      setManagersLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    loadManagers()
  }, [loadManagers])

  // Load the phases for this property's track, so the module library can be
  // grouped by phase. Re-runs whenever the venue type changes.
  useEffect(() => {
    const track = property?.venue_type
    if (!track) { setPhases([]); return }
    let cancelled = false
    fetch(`/api/phases?track=${encodeURIComponent(track)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.phases) setPhases(d.phases as Phase[]) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [property?.venue_type])

  // ── Invite a manager ──────────────────────────────────────────
  function openInviteModal() {
    setInviteName('')
    setInviteEmail('')
    setInviteError(null)
    setCreatedLink(null)
    setInviteModalOpen(true)
  }

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault()
    if (inviteSubmitting) return
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Name and email are both required.')
      return
    }
    setInviteSubmitting(true)
    setInviteError(null)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/managers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: inviteName.trim(), email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.error || 'Failed to create invite')
        return
      }
      setCreatedLink(data.invite_link)
      loadManagers()
    } catch {
      setInviteError('Network error — please try again')
    } finally {
      setInviteSubmitting(false)
    }
  }

  // ── Deletes ───────────────────────────────────────────────────
  async function confirmDeleteProperty(): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        showToast('err', data.error || 'Failed to delete property')
        return false
      }
      showToast('ok', 'Property deleted')
      router.push('/admin')
      return true
    } catch {
      showToast('err', 'Network error — please try again')
      return false
    }
  }

  async function confirmDeleteManager(): Promise<boolean> {
    const target = deleteManagerTarget
    if (!target) return false
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/managers/${target.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        showToast('err', data.error || 'Failed to remove manager')
        return false
      }
      setManagers((prev) => prev.filter((m) => m.id !== target.id))
      showToast('ok', 'Manager removed')
      setDeleteManagerTarget(null)
      return true
    } catch {
      showToast('err', 'Network error — please try again')
      return false
    }
  }

  async function cancelInvite(inv: PendingInvite) {
    if (!window.confirm(`Cancel the invite for ${inv.full_name}? This can't be undone.`)) return
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/invites/${inv.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        showToast('err', data.error || 'Failed to cancel invite')
        return
      }
      setPendingInvites((prev) => prev.filter((i) => i.id !== inv.id))
      showToast('ok', 'Invite cancelled')
    } catch {
      showToast('err', 'Network error — please try again')
    }
  }

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

  // Upload a logo file, then persist its public URL onto the property via the
  // same PATCH path as the other editable fields.
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file || !property) return
    setLogoUploading(true)
    setDetailsMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('propertyId', property.id)
      const res = await fetch('/api/admin/upload-logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setDetailsMsg({ tone: 'err', text: data.error || 'Failed to upload logo' })
      } else {
        await patchField('logo_url', data.url)
      }
    } catch {
      setDetailsMsg({ tone: 'err', text: 'Network error' })
    } finally {
      setLogoUploading(false)
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

            <div>
              <label style={labelStyle}>Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                    border: '1px solid var(--sand-deeper)',
                    background: property.logo_url ? '#051956' : 'var(--sand-warm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {property.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={property.logo_url} alt="Logo" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
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
                    cursor: logoUploading ? 'default' : 'pointer',
                  }}
                >
                  {logoUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  {logoUploading ? 'Uploading…' : property.logo_url ? 'Replace logo' : 'Upload logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={logoUploading}
                    style={{ display: 'none' }}
                  />
                </label>
                {property.logo_url && (
                  <button
                    type="button"
                    onClick={() => patchField('logo_url', '')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sand-deeper)',
                      background: 'white', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Managers ── */}
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <h2 style={sectionTitleStyle}>Managers</h2>
            <button
              onClick={openInviteModal}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 10, border: 'none',
                background: '#F5A623', color: '#051956',
                fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <UserPlus size={15} /> Invite Manager
            </button>
          </div>
          <p style={sectionSubStyle}>
            Managers run this property — they log in, onboard staff, and track progress.
          </p>

          {managersLoading ? (
            <div style={{ padding: '8px 0', color: 'var(--ink-soft)', fontSize: 14 }}>Loading…</div>
          ) : managers.length === 0 && pendingInvites.length === 0 ? (
            <div
              style={{
                padding: '24px', textAlign: 'center', borderRadius: 12,
                border: '1px dashed var(--sand-deeper)', color: 'var(--ink-soft)', fontSize: 14,
              }}
            >
              No managers yet. Invite the first one to get this property started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {managers.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', borderRadius: 12,
                    border: '1px solid var(--sand-deeper)', background: 'white',
                  }}
                >
                  <span
                    style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--sand-warm)', color: 'var(--ocean-deep)',
                      fontSize: 13, fontWeight: 800,
                    }}
                  >
                    {m.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--ocean-deep)' }}>
                      {m.full_name}
                    </span>
                    <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-soft)' }}>
                      {m.email}
                    </span>
                  </span>
                  <span
                    style={{
                      flexShrink: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: 'var(--sage-deep)',
                      background: 'rgba(94,139,126,0.12)', padding: '4px 9px', borderRadius: 999,
                    }}
                  >
                    Active
                  </span>
                  <button
                    onClick={() => setDeleteManagerTarget(m)}
                    style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '6px 11px', borderRadius: 9,
                      border: `1px solid ${DANGER_RED}`, background: 'white',
                      color: DANGER_RED, fontSize: 12, fontWeight: 700,
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              ))}

              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', borderRadius: 12,
                    border: '1px dashed var(--sand-deeper)', background: 'rgba(245,166,35,0.04)',
                  }}
                >
                  <span
                    style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(245,166,35,0.16)', color: '#8a6000',
                    }}
                  >
                    <Mail size={16} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--ocean-deep)' }}>
                      {inv.full_name}
                    </span>
                    <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-soft)' }}>
                      {inv.email} · Invite sent
                    </span>
                  </span>
                  <button
                    onClick={() => copyLink(inv.invite_link)}
                    style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 12px', borderRadius: 9,
                      border: '1px solid var(--sand-deeper)', background: 'white',
                      color: 'var(--ocean-deep)', fontSize: 12.5, fontWeight: 700,
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    {copiedLink === inv.invite_link ? (
                      <><Check size={14} /> Copied</>
                    ) : (
                      <><Copy size={14} /> Copy link</>
                    )}
                  </button>
                  <button
                    onClick={() => cancelInvite(inv)}
                    style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '8px 11px', borderRadius: 9,
                      border: `1px solid ${DANGER_RED}`, background: 'white',
                      color: DANGER_RED, fontSize: 12.5, fontWeight: 700,
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    <X size={13} /> Cancel invite
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 3. Module Library ── */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Module Library</h2>
          <p style={sectionSubStyle}>
            {assignedCount} of {CURRICULUM.length} modules assigned, grouped by phase. Toggle to assign or remove.
          </p>

          {!property.venue_type && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.35)',
                color: '#8a6000', fontSize: 13.5, fontWeight: 500,
              }}
            >
              <AlertCircle size={16} /> Set venue type to enable phase-based assignment.
            </div>
          )}

          {(() => {
            // Group CURRICULUM modules by phase_id. Any module without a phase_id
            // lands in the "to be categorized" bucket shown last.
            const renderModuleButton = (m: typeof CURRICULUM[number]) => {
              const isAssigned = assigned.has(m.id)
              const busy = moduleBusy === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => !busy && toggleModule(m.id)}
                  disabled={busy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12, textAlign: 'left', width: '100%',
                    cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
                    background: isAssigned ? 'rgba(245,166,35,0.06)' : 'white',
                    border: isAssigned ? '1.5px solid #F5A623' : '1px solid var(--sand-deeper)',
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isAssigned ? '#F5A623' : 'var(--sand-warm)',
                      border: isAssigned ? 'none' : '1px solid var(--sand-deeper)',
                      color: '#051956',
                    }}
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : isAssigned ? <Check size={14} /> : null}
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
            }

            const groupHeading = (label: string, sub: string) => (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '4px 0 2px' }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand-deep)' }}>
                  {label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{sub}</span>
              </div>
            )

            const uncategorized = CURRICULUM.filter((m) => !m.phase_id)

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {phases.map((ph) => {
                  const mods = CURRICULUM.filter((m) => m.phase_id === ph.id)
                  return (
                    <div key={ph.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {groupHeading(`Phase ${ph.phase_number} — ${ph.title}`, ph.certification_title)}
                      {mods.length === 0 ? (
                        <div style={{ padding: '14px 16px', borderRadius: 12, border: '1px dashed var(--sand-deeper)', color: 'var(--ink-soft)', fontSize: 13 }}>
                          No modules assigned yet
                        </div>
                      ) : (
                        mods.map(renderModuleButton)
                      )}
                    </div>
                  )
                })}

                {uncategorized.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {groupHeading('To be categorized', 'Not yet assigned to a phase')}
                    {uncategorized.map(renderModuleButton)}
                  </div>
                )}
              </div>
            )
          })()}
        </section>

        {/* ── 4. Property Overrides ── */}
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

        {/* ── 5. Danger Zone ── */}
        <section
          style={{
            ...cardStyle,
            border: `1.5px solid ${DANGER_RED}`,
            background: 'rgba(214,69,69,0.03)',
            marginTop: 12,
          }}
        >
          <h2 style={{ ...sectionTitleStyle, color: DANGER_RED }}>Danger Zone</h2>
          <p style={sectionSubStyle}>
            Permanent, irreversible actions. Proceed with care.
          </p>
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap',
              padding: '16px 18px', borderRadius: 12,
              border: `1px solid ${DANGER_RED}`, background: 'white',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ocean-deep)' }}>
                Delete this property
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                Deletes the property and every manager, staff member, and all training data.
              </div>
            </div>
            <button
              onClick={() => setDeletePropertyOpen(true)}
              style={{
                flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 16px', borderRadius: 10, border: 'none',
                background: DANGER_RED, color: 'white',
                fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <Trash2 size={15} /> Delete Property
            </button>
          </div>
        </section>

      </div>

      {/* ── Delete Property modal ── */}
      {deletePropertyOpen && (
        <ConfirmDeleteModal
          title={`Delete ${property.name} permanently?`}
          warning={
            <>
              This will permanently delete <strong>{property.name}</strong> and ALL data — every
              manager, every staff member, all training progress, all roleplay sessions, all module
              assignments. This cannot be undone.
            </>
          }
          inputLabel="Type the property name to confirm:"
          placeholder={property.name}
          expected={property.name}
          confirmLabel="Delete Property"
          onCancel={() => setDeletePropertyOpen(false)}
          onConfirm={confirmDeleteProperty}
        />
      )}

      {/* ── Remove Manager modal ── */}
      {deleteManagerTarget && (
        <ConfirmDeleteModal
          title={`Remove ${deleteManagerTarget.full_name}?`}
          warning={
            <>
              This will permanently delete{' '}
              <strong>{deleteManagerTarget.full_name}</strong>&apos;s account. They will lose access
              immediately.
            </>
          }
          inputLabel="Type the manager's email to confirm:"
          placeholder={deleteManagerTarget.email}
          expected={deleteManagerTarget.email}
          confirmLabel="Remove Manager"
          onCancel={() => setDeleteManagerTarget(null)}
          onConfirm={confirmDeleteManager}
        />
      )}

      {/* ── Floating toast for destructive actions ── */}
      {pageToast && (
        <div
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 70, display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 18px', borderRadius: 12,
            background: 'white', border: `1px solid ${pageToast.tone === 'ok' ? 'var(--sage-deep)' : DANGER_RED}`,
            boxShadow: '0 16px 40px -16px rgba(5,25,86,0.4)',
            fontSize: 14, fontWeight: 700,
            color: pageToast.tone === 'ok' ? 'var(--sage-deep)' : DANGER_RED,
          }}
        >
          {pageToast.tone === 'ok' ? <Check size={16} /> : <AlertCircle size={16} />}
          {pageToast.text}
        </div>
      )}

      {/* ── Invite Manager modal ── */}
      {inviteModalOpen && (
        <div
          onClick={() => setInviteModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(5,25,86,0.32)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460, background: 'white',
              borderRadius: 18, border: '1px solid var(--sand-deeper)',
              boxShadow: '0 24px 60px -20px rgba(5,25,86,0.45)', padding: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
              <h2 style={sectionTitleStyle}>Invite Manager</h2>
              <button
                onClick={() => setInviteModalOpen(false)}
                title="Close"
                style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                  border: '1px solid var(--sand-deeper)', background: 'white',
                  color: 'var(--ink-soft)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {createdLink ? (
              <>
                <p style={{ ...sectionSubStyle, marginBottom: 18 }}>
                  Invite created. Send this link to the manager. It expires in 7 days.
                </p>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 10,
                    border: '1px solid var(--sand-deeper)', background: 'var(--sand)',
                    marginBottom: 18,
                  }}
                >
                  <span
                    style={{
                      flex: 1, minWidth: 0, fontSize: 12.5, fontFamily: 'monospace',
                      color: 'var(--ocean-deep)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {createdLink}
                  </span>
                  <button
                    onClick={() => copyLink(createdLink)}
                    style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 12px', borderRadius: 9, border: 'none',
                      background: '#F5A623', color: '#051956',
                      fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    {copiedLink === createdLink ? (
                      <><Check size={14} /> Copied</>
                    ) : (
                      <><Copy size={14} /> Copy</>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setInviteModalOpen(false)}
                  style={{
                    width: '100%', padding: '11px 18px', borderRadius: 10,
                    border: '1px solid var(--sand-deeper)', background: 'white',
                    color: 'var(--ocean-deep)', fontSize: 14, fontWeight: 700,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <form onSubmit={submitInvite}>
                <p style={{ ...sectionSubStyle, marginBottom: 18 }}>
                  Create the first manager account for this property. They&apos;ll set their own
                  password via the invite link.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label htmlFor="inv-name" style={labelStyle}>Full Name</label>
                    <input
                      id="inv-name"
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Jordan Rivera"
                      autoFocus
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="inv-email" style={labelStyle}>Email</label>
                    <input
                      id="inv-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="jordan@property.com"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {inviteError && (
                  <div style={{ marginBottom: 16 }}>
                    <Toast tone="err" text={inviteError} />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  style={{
                    width: '100%', display: 'inline-flex', alignItems: 'center',
                    justifyContent: 'center', gap: 7,
                    padding: '12px 18px', borderRadius: 10, border: 'none',
                    background: '#F5A623', color: '#051956',
                    fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
                    cursor: inviteSubmitting ? 'default' : 'pointer',
                    opacity: inviteSubmitting ? 0.6 : 1,
                  }}
                >
                  {inviteSubmitting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                  {inviteSubmitting ? 'Creating…' : 'Create invite'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
