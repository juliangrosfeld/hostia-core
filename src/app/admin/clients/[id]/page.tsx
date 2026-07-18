'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Check, AlertCircle, Save, Plus, Trash2, Loader2,
  UserPlus, Copy, Mail, X, Upload, ChevronDown, ChevronRight, Trophy,
  FileText, Lock, Unlock,
} from 'lucide-react'
import { CURRICULUM, type Phase } from '@/lib/curriculum'

const VENUE_TYPES = [
  { value: 'casual-dining', label: 'Casual Dining' },
  { value: 'fine-dining', label: 'Fine Dining' },
  { value: 'fast-casual', label: 'Fast Casual' },
]

// Overrides we always surface in the editor, even before they're set.
const DEFAULT_OVERRIDE_KEYS = ['property_name', 'scenario_context', 'manager_name']

// Managed by the Module Library's per-module unlock toggle, never by the raw
// overrides editor — a JSON array of module ids the staff app treats as
// unlocked regardless of sequential order (additive: it can only unlock).
const UNLOCKED_MODULES_KEY = 'unlocked_modules'

// scenario_context gets a multiline textarea — it's the AI roleplay context.
const TEXTAREA_KEYS = new Set(['scenario_context'])

interface Property {
  id: string
  name: string
  venue_type: string | null
  primary_color: string | null
  logo_url: string | null
  menu_pdf_url: string | null
}
interface PropertyModule {
  module_id: string
  is_active: boolean
}
interface ModulePhaseAssignment {
  module_id: string
  phase_id: string
  order_in_phase: number
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

// Guided builder for the scenario_context override: a few prompted fields
// composed into the venue paragraph that seeds every AI roleplay prompt.
// Inserting only fills the textarea — the admin still reviews and saves.
function ScenarioContextBuilder({
  propertyName, hasExisting, onInsert,
}: {
  propertyName: string; hasExisting: boolean; onInsert: (text: string) => void;
}) {
  const [open, setOpen] = useState(false)
  const [venueDesc, setVenueDesc] = useState('')
  const [location, setLocation] = useState('')
  const [menu, setMenu] = useState('')
  const [serviceStyle, setServiceStyle] = useState('')

  function compose(): string {
    const name = propertyName.trim() || 'This restaurant'
    const sentences = [
      `${name} is ${venueDesc.trim()}${location.trim() ? ` in ${location.trim()}` : ''}.`,
    ]
    if (menu.trim()) sentences.push(`The menu centers on ${menu.trim()}.`)
    if (serviceStyle.trim()) sentences.push(`Service style: ${serviceStyle.trim()}.`)
    return sentences.join(' ')
  }

  const fieldStyle: React.CSSProperties = { ...inputStyle, fontSize: 13.5, padding: '9px 12px' }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 8, border: '1px dashed var(--sand-deeper)',
          background: 'var(--sand)', color: 'var(--ocean-deep)',
          fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
        }}
      >
        <Plus size={13} /> Use guided template
      </button>
    )
  }

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: '14px 16px', borderRadius: 12,
        border: '1px solid var(--sand-deeper)', background: 'var(--sand)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ocean-deep)' }}>
          Guided template
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          title="Close template"
          style={{
            width: 26, height: 26, borderRadius: 7, border: '1px solid var(--sand-deeper)',
            background: 'white', color: 'var(--ink-soft)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={13} />
        </button>
      </div>
      <div>
        <label style={{ ...labelStyle, marginBottom: 5 }}>What kind of venue? *</label>
        <input type="text" value={venueDesc} onChange={(e) => setVenueDesc(e.target.value)} placeholder="a gourmet burger restaurant" style={fieldStyle} />
      </div>
      <div>
        <label style={{ ...labelStyle, marginBottom: 5 }}>Location</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Willemstad, Curaçao" style={fieldStyle} />
      </div>
      <div>
        <label style={{ ...labelStyle, marginBottom: 5 }}>Menu &amp; signature items</label>
        <input type="text" value={menu} onChange={(e) => setMenu(e.target.value)} placeholder="smash burgers, loaded fries, local craft beers" style={fieldStyle} />
      </div>
      <div>
        <label style={{ ...labelStyle, marginBottom: 5 }}>Service style</label>
        <input type="text" value={serviceStyle} onChange={(e) => setServiceStyle(e.target.value)} placeholder="relaxed counter service — quick, warm, personal" style={fieldStyle} />
      </div>
      <button
        type="button"
        disabled={!venueDesc.trim()}
        onClick={() => {
          onInsert(compose())
          setOpen(false)
        }}
        style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 14px', borderRadius: 9, border: 'none',
          background: '#F5A623', color: '#051956',
          fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
          cursor: venueDesc.trim() ? 'pointer' : 'default',
          opacity: venueDesc.trim() ? 1 : 0.5,
        }}
      >
        <Check size={14} /> {hasExisting ? 'Replace scenario context' : 'Insert into scenario context'}
      </button>
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
  const [cancelInviteTarget, setCancelInviteTarget] = useState<PendingInvite | null>(null)

  const [property, setProperty] = useState<Property | null>(null)
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [overrides, setOverrides] = useState<Override[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  // module→phase mapping from module_phase_assignments — the SAME source
  // /api/curriculum uses for staff, so admin grouping can never drift from
  // what staff actually see. (curriculum.ts carries no phase fields anymore.)
  const [phaseAssignments, setPhaseAssignments] = useState<ModulePhaseAssignment[]>([])
  // Module ids assigned to a phase in ANY track — a module missing from this
  // track's mapping but present here belongs to another track and is hidden,
  // instead of landing in "to be categorized".
  const [allAssignedIds, setAllAssignedIds] = useState<Set<string>>(new Set())
  // Collapsed/expanded phase groups. null = not yet initialized (phases still
  // loading); once loaded, phases that actually have content start expanded.
  const [expandedPhases, setExpandedPhases] = useState<Set<string> | null>(null)
  const [assignAllBusy, setAssignAllBusy] = useState<string | null>(null)

  const [staffCount, setStaffCount] = useState(0)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Per-area status messages.
  const [detailsMsg, setDetailsMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [menuUploading, setMenuUploading] = useState(false)
  const [moduleBusy, setModuleBusy] = useState<string | null>(null)
  const [unlockedModules, setUnlockedModules] = useState<Set<string>>(new Set())
  const [unlockBusy, setUnlockBusy] = useState<string | null>(null)
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
        setStaffCount(typeof data.staffCount === 'number' ? data.staffCount : 0)

        // The unlocked-modules override is owned by the Module Library toggle;
        // pull it out before the raw overrides editor ever sees it.
        const allStored: Override[] = (data.propertyOverrides ?? []).map((o: Override) => ({
          key: o.key,
          value: o.value,
        }))
        const unlockRow = allStored.find((o) => o.key === UNLOCKED_MODULES_KEY)
        if (unlockRow) {
          try {
            const parsed: unknown = JSON.parse(unlockRow.value)
            if (Array.isArray(parsed)) {
              setUnlockedModules(new Set(parsed.filter((v): v is string => typeof v === 'string')))
            }
          } catch {
            // Malformed value — leave the set empty; the next toggle rewrites it.
          }
        }

        // Merge stored overrides with the default keys so they always appear.
        const stored = allStored.filter((o) => o.key !== UNLOCKED_MODULES_KEY)
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
  // Fetched by the effect below; loadManagers() just bumps the version to
  // trigger a refetch (e.g. after creating an invite).
  const [managersVersion, setManagersVersion] = useState(0)
  const loadManagers = useCallback(() => setManagersVersion((v) => v + 1), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/properties/${propertyId}/managers`)
        const data = await res.json()
        if (!cancelled && res.ok) {
          setManagers(data.managers ?? [])
          setPendingInvites(data.pendingInvites ?? [])
        }
      } catch {
        // Non-fatal — the section just shows empty until a retry.
      } finally {
        if (!cancelled) setManagersLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [propertyId, managersVersion])

  // Load the phases for this property's track, so the module library can be
  // grouped by phase. Re-runs whenever the venue type changes.
  useEffect(() => {
    const track = property?.venue_type
    // No track yet = property still loading; phases/assignments are already
    // empty (their initial state), so there's nothing to reset.
    if (!track) return
    let cancelled = false
    fetch(`/api/phases?track=${encodeURIComponent(track)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.phases) return
        const loadedPhases = d.phases as Phase[]
        const loadedAssignments = (d.assignments ?? []) as ModulePhaseAssignment[]
        setPhases(loadedPhases)
        setPhaseAssignments(loadedAssignments)
        setAllAssignedIds(new Set((d.allAssignedModuleIds ?? []) as string[]))
        // Initial expand state: phases that have at least one real (lesson-
        // carrying) module open, empty future phases collapsed.
        const contentIds = new Set(CURRICULUM.filter((m) => m.totalLessons > 0).map((m) => m.id))
        const phasesWithContent = new Set(
          loadedAssignments.filter((a) => contentIds.has(a.module_id)).map((a) => a.phase_id)
        )
        setExpandedPhases(new Set(loadedPhases.filter((p) => phasesWithContent.has(p.id)).map((p) => p.id)))
      })
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

  async function confirmCancelInvite(): Promise<boolean> {
    const inv = cancelInviteTarget
    if (!inv) return false
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/invites/${inv.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        showToast('err', data.error || 'Failed to cancel invite')
        return false
      }
      setPendingInvites((prev) => prev.filter((i) => i.id !== inv.id))
      showToast('ok', 'Invite cancelled')
      setCancelInviteTarget(null)
      return true
    } catch {
      showToast('err', 'Network error — please try again')
      return false
    }
  }

  // The hex text input feeds --brand-color on every staff page — never persist
  // anything that isn't a real 6-digit hex color (empty clears it).
  function patchPrimaryColor(value: string) {
    const v = value.trim()
    if (v !== '' && !/^#[0-9a-fA-F]{6}$/.test(v)) {
      setDetailsMsg({ tone: 'err', text: 'Enter a hex color like #1A2B3C' })
      return
    }
    patchField('primary_color', v)
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

  // Upload a menu file (PDF or image), then persist its public URL onto the
  // property via the same PATCH path as the other editable fields.
  async function handleMenuUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file || !property) return
    setMenuUploading(true)
    setDetailsMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('propertyId', property.id)
      const res = await fetch('/api/admin/upload-menu', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setDetailsMsg({ tone: 'err', text: data.error || 'Failed to upload menu' })
      } else {
        await patchField('menu_pdf_url', data.url)
      }
    } catch {
      setDetailsMsg({ tone: 'err', text: 'Network error' })
    } finally {
      setMenuUploading(false)
    }
  }

  // ── Early-unlock override ─────────────────────────────────────
  // Toggles a module in the property's unlocked_modules override. The staff
  // curriculum API applies it ON TOP of sequential locking (it can only ever
  // unlock, never lock) — the sequential mechanism itself is untouched.
  async function toggleUnlockEarly(moduleId: string) {
    if (unlockBusy) return
    const next = new Set(unlockedModules)
    if (next.has(moduleId)) next.delete(moduleId)
    else next.add(moduleId)
    setUnlockBusy(moduleId)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overrides: [{ key: UNLOCKED_MODULES_KEY, value: JSON.stringify([...next].sort()) }],
        }),
      })
      if (res.ok) setUnlockedModules(next)
    } catch {
      // Network error — state stays as it was; the toggle can be retried.
    } finally {
      setUnlockBusy(null)
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

  // ── Assign every missing module of a phase in one call ────────
  async function assignAllInPhase(phaseId: string, moduleIds: string[]) {
    if (assignAllBusy || moduleIds.length === 0) return
    setAssignAllBusy(phaseId)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_ids: moduleIds }),
      })
      if (res.ok) {
        setAssigned((prev) => new Set([...prev, ...moduleIds]))
      }
    } catch {
      // leave the toggles as-is on failure
    } finally {
      setAssignAllBusy(null)
    }
  }

  function togglePhaseExpanded(phaseId: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev ?? [])
      if (next.has(phaseId)) next.delete(phaseId)
      else next.add(phaseId)
      return next
    })
  }

  // ── Track-scoped module sets ──────────────────────────────────
  // Only lesson-carrying modules count — the 0-lesson certification pseudo-
  // module is never listed as assignable (the staff home synthesizes its own
  // exam card and ignores any property_modules row for it).
  const metaByModule = useMemo(
    () => new Map(phaseAssignments.map((a) => [a.module_id, a])),
    [phaseAssignments]
  )
  const trackModules = useMemo(
    () => CURRICULUM.filter((m) => m.totalLessons > 0 && metaByModule.has(m.id)),
    [metaByModule]
  )
  // Genuinely uncategorized = in no track's phase mapping at all. Modules
  // mapped to another track's phases are simply not this property's business.
  const uncategorized = useMemo(
    () => CURRICULUM.filter((m) => m.totalLessons > 0 && !metaByModule.has(m.id) && !allAssignedIds.has(m.id)),
    [metaByModule, allAssignedIds]
  )
  const assignedTrackCount = useMemo(
    () => trackModules.filter((m) => assigned.has(m.id)).length,
    [trackModules, assigned]
  )
  const hasTrack = Boolean(property?.venue_type) && phases.length > 0
  const trackLabel = VENUE_TYPES.find((v) => v.value === property?.venue_type)?.label ?? ''

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

        {/* ── 0. Setup checklist — derived live from real data, no state of
               its own. Vanishes into a slim confirmation once complete. ── */}
        {(() => {
          const scenarioContextValue = (overrides.find((o) => o.key === 'scenario_context')?.value ?? '').trim()
          const items: { key: string; label: string; done: boolean; hint: string; target: string }[] = [
            {
              key: 'venue',
              label: 'Set the venue type',
              done: Boolean(property.venue_type),
              hint: 'Drives the curriculum track, phases, and exams.',
              target: 'section-details',
            },
            {
              key: 'modules',
              label: 'Assign the track’s modules',
              done: hasTrack && trackModules.length > 0 && assignedTrackCount === trackModules.length,
              hint: hasTrack ? `${assignedTrackCount} of ${trackModules.length} assigned.` : 'Set the venue type first.',
              target: 'section-modules',
            },
            {
              key: 'logo',
              label: 'Upload the client logo',
              done: Boolean(property.logo_url),
              hint: 'Shown across the staff app and manager dashboard.',
              target: 'section-details',
            },
            {
              key: 'menu',
              label: 'Upload the menu',
              done: Boolean(property.menu_pdf_url),
              hint: 'Shown to staff inside the "Our Menu" onboarding lesson.',
              target: 'section-details',
            },
            {
              key: 'context',
              label: 'Write the roleplay scenario context',
              done: scenarioContextValue !== '',
              hint: 'Seeds every AI guest conversation for this client.',
              target: 'section-overrides',
            },
            {
              key: 'invite',
              label: 'Invite a manager',
              done: managers.length + pendingInvites.length > 0,
              hint: 'They run onboarding for their own staff.',
              target: 'section-managers',
            },
            {
              key: 'accepted',
              label: 'Manager accepts the invite',
              done: managers.length > 0,
              hint: 'The invite link expires after 7 days.',
              target: 'section-managers',
            },
            {
              key: 'staff',
              label: 'First staff member onboarded',
              done: staffCount > 0,
              hint: 'Managers add staff from their dashboard.',
              target: 'section-managers',
            },
          ]
          const doneCount = items.filter((i) => i.done).length
          const allDone = doneCount === items.length

          if (allDone) {
            return (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '13px 18px', borderRadius: 14,
                  border: '1px solid rgba(94,139,126,0.4)', background: 'rgba(94,139,126,0.08)',
                  color: 'var(--sage-deep)', fontSize: 14, fontWeight: 700,
                }}
              >
                <Check size={16} strokeWidth={2.5} /> Setup complete — this client is live-ready.
              </div>
            )
          }

          return (
            <section style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <h2 style={sectionTitleStyle}>Setup checklist</h2>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>
                  {doneCount} of {items.length} done
                </span>
              </div>
              <p style={sectionSubStyle}>Everything this client needs before staff can start training.</p>
              <div style={{ height: 6, borderRadius: 999, background: 'var(--sand-warm)', marginBottom: 18, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(doneCount / items.length) * 100}%`, borderRadius: 999, background: '#F5A623', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%',
                      padding: '9px 10px', borderRadius: 10, border: 'none',
                      background: 'transparent', textAlign: 'left',
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: item.done ? 'var(--sage-deep)' : 'white',
                        border: item.done ? 'none' : '1.5px solid var(--sand-deeper)',
                        color: 'white',
                      }}
                    >
                      {item.done && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block', fontSize: 14, fontWeight: 600,
                          color: item.done ? 'var(--ink-soft)' : 'var(--ocean-deep)',
                          textDecoration: item.done ? 'line-through' : 'none',
                          textDecorationColor: 'var(--sand-deeper)',
                        }}
                      >
                        {item.label}
                      </span>
                      {!item.done && (
                        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 1 }}>
                          {item.hint}
                        </span>
                      )}
                    </span>
                    {!item.done && <ChevronRight size={15} color="var(--ink-soft)" style={{ flexShrink: 0, marginTop: 3 }} />}
                  </button>
                ))}
              </div>
            </section>
          )
        })()}

        {/* ── 1. Property Details ── */}
        <section id="section-details" style={cardStyle}>
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
                  onBlur={(e) => patchPrimaryColor(e.target.value)}
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
                    <img src={property.logo_url} alt="Logo" className="client-logo" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
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
                    accept="image/png,image/jpeg,image/webp"
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

            <div>
              <label style={labelStyle}>Menu</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                    border: '1px solid var(--sand-deeper)',
                    background: 'var(--sand-warm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <FileText size={18} color={property.menu_pdf_url ? 'var(--brand)' : 'var(--ink-soft)'} />
                </div>
                <label
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 10,
                    border: '1px solid var(--sand-deeper)', background: 'white',
                    fontSize: 13.5, fontWeight: 700, color: 'var(--ink)',
                    cursor: menuUploading ? 'default' : 'pointer',
                  }}
                >
                  {menuUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  {menuUploading ? 'Uploading…' : property.menu_pdf_url ? 'Replace menu' : 'Upload menu (PDF or image)'}
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={handleMenuUpload}
                    disabled={menuUploading}
                    style={{ display: 'none' }}
                  />
                </label>
                {property.menu_pdf_url && (
                  <>
                    <a
                      href={property.menu_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', textDecoration: 'none' }}
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => patchField('menu_pdf_url', '')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sand-deeper)',
                        background: 'white', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Managers ── */}
        <section id="section-managers" style={cardStyle}>
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
                    onClick={() => setCancelInviteTarget(inv)}
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
        <section id="section-modules" style={cardStyle}>
          <h2 style={sectionTitleStyle}>Module Library</h2>
          <p style={sectionSubStyle}>
            {hasTrack
              ? `${assignedTrackCount} of ${trackModules.length} ${trackLabel} modules assigned, grouped by phase. Toggle to assign or remove.`
              : 'Toggle to assign or remove modules.'}
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
                  {isAssigned && hasTrack && (() => {
                    const isUnlocked = unlockedModules.has(m.id)
                    const unlockingBusy = unlockBusy === m.id
                    return (
                      <span
                        role="button"
                        tabIndex={0}
                        title={
                          isUnlocked
                            ? 'Unlocked early for staff — click to restore sequential locking'
                            : 'Follows sequential order — click to unlock early for staff'
                        }
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!unlockingBusy) toggleUnlockEarly(m.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!unlockingBusy) toggleUnlockEarly(m.id)
                          }
                        }}
                        style={{
                          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 10px', borderRadius: 999,
                          border: isUnlocked ? '1px solid rgba(94,139,126,0.5)' : '1px solid var(--sand-deeper)',
                          background: isUnlocked ? 'rgba(94,139,126,0.12)' : 'white',
                          color: isUnlocked ? 'var(--sage-deep)' : 'var(--ink-soft)',
                          fontSize: 11, fontWeight: 700,
                          cursor: unlockingBusy ? 'default' : 'pointer',
                          opacity: unlockingBusy ? 0.6 : 1,
                        }}
                      >
                        {unlockingBusy ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : isUnlocked ? (
                          <Unlock size={12} />
                        ) : (
                          <Lock size={12} />
                        )}
                        {isUnlocked ? 'Unlocked early' : 'Sequential'}
                      </span>
                    )
                  })()}
                </button>
              )
            }

            // No usable track yet (venue type unset, or its phases haven't
            // loaded) — flat list of every lesson-carrying module so a
            // track-less property (e.g. the demo) stays manageable.
            if (!hasTrack) {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {CURRICULUM.filter((m) => m.totalLessons > 0).map(renderModuleButton)}
                </div>
              )
            }

            const byOrder = (a: typeof CURRICULUM[number], b: typeof CURRICULUM[number]) =>
              (metaByModule.get(a.id)?.order_in_phase ?? 999) -
              (metaByModule.get(b.id)?.order_in_phase ?? 999)

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {phases.map((ph) => {
                  const mods = trackModules
                    .filter((m) => metaByModule.get(m.id)?.phase_id === ph.id)
                    .sort(byOrder)
                  // The 0-lesson certification pseudo-module marks this phase
                  // as having an exam — shown as a fixed line, never a toggle.
                  const hasExam = CURRICULUM.some(
                    (m) => m.totalLessons === 0 && metaByModule.get(m.id)?.phase_id === ph.id
                  )
                  const assignedInPhase = mods.filter((m) => assigned.has(m.id)).length
                  const missing = mods.filter((m) => !assigned.has(m.id)).map((m) => m.id)
                  const hasContent = mods.length > 0
                  const expanded = hasContent && (expandedPhases?.has(ph.id) ?? true)
                  const busy = assignAllBusy === ph.id

                  return (
                    <div key={ph.id} style={{ border: '1px solid var(--sand-deeper)', borderRadius: 14, background: 'white' }}>
                      <button
                        onClick={() => hasContent && togglePhaseExpanded(ph.id)}
                        aria-expanded={expanded}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '13px 16px', border: 'none', background: 'transparent',
                          textAlign: 'left', fontFamily: 'inherit',
                          cursor: hasContent ? 'pointer' : 'default',
                        }}
                      >
                        <span style={{ flexShrink: 0, width: 16, display: 'flex', color: hasContent ? 'var(--ink-soft)' : 'var(--sand-deeper)' }}>
                          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand-deep)' }}>
                            Phase {ph.phase_number} — {ph.title}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{ph.certification_title}</span>
                        </span>
                        {hasContent ? (
                          <>
                            {missing.length > 0 && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  assignAllInPhase(ph.id, missing)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    assignAllInPhase(ph.id, missing)
                                  }
                                }}
                                style={{
                                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '6px 11px', borderRadius: 8, border: 'none',
                                  background: '#F5A623', color: '#051956',
                                  fontSize: 12, fontWeight: 800,
                                  cursor: busy ? 'default' : 'pointer',
                                  opacity: busy ? 0.6 : 1,
                                }}
                              >
                                {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                                Assign all
                              </span>
                            )}
                            <span
                              style={{
                                flexShrink: 0, fontSize: 11.5, fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                                color: assignedInPhase === mods.length ? 'var(--sage-deep)' : 'var(--ink-soft)',
                                background: assignedInPhase === mods.length ? 'rgba(94,139,126,0.12)' : 'var(--sand-warm)',
                                padding: '4px 10px', borderRadius: 999,
                              }}
                            >
                              {assignedInPhase}/{mods.length} assigned
                            </span>
                          </>
                        ) : (
                          <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', padding: '4px 2px' }}>
                            No content yet
                          </span>
                        )}
                      </button>

                      {expanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '2px 14px 14px' }}>
                          {mods.map(renderModuleButton)}
                          {hasExam && (
                            <div
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '12px 16px', borderRadius: 12,
                                border: '1px dashed #B8860B', background: 'rgba(184,134,11,0.05)',
                                fontSize: 13, color: 'var(--ink)',
                              }}
                            >
                              <Trophy size={15} color="#B8860B" />
                              <span style={{ fontWeight: 700 }}>Exam — {ph.certification_title}</span>
                              <span style={{ color: 'var(--ink-soft)', fontSize: 12.5 }}>
                                appears automatically once every module above is complete
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {uncategorized.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '4px 0 2px' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand-deep)' }}>
                        To be categorized
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Not in any track&apos;s phase mapping yet</span>
                    </div>
                    {uncategorized.map(renderModuleButton)}
                  </div>
                )}
              </div>
            )
          })()}
        </section>

        {/* ── 4. Property Overrides ── */}
        <section id="section-overrides" style={cardStyle}>
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
                    <>
                      <textarea
                        value={o.value}
                        onChange={(e) => setOverrideValue(o.key, e.target.value)}
                        rows={4}
                        placeholder="This is Brgr Haus, a gourmet burger restaurant in Willemstad, Curaçao…"
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, minHeight: 96 }}
                      />
                      {o.key === 'scenario_context' && (
                        <ScenarioContextBuilder
                          propertyName={
                            (overrides.find((ov) => ov.key === 'property_name')?.value ?? '').trim() || property.name
                          }
                          hasExisting={o.value.trim() !== ''}
                          onInsert={(text) => setOverrideValue('scenario_context', text)}
                        />
                      )}
                    </>
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

      {/* ── Cancel Invite modal ── */}
      {cancelInviteTarget && (
        <ConfirmDeleteModal
          title={`Cancel ${cancelInviteTarget.full_name}'s invite?`}
          warning={
            <>
              This invalidates the invite link sent to{' '}
              <strong>{cancelInviteTarget.email}</strong>. You can always send a new invite later.
            </>
          }
          inputLabel="Type the invitee's email to confirm:"
          placeholder={cancelInviteTarget.email}
          expected={cancelInviteTarget.email}
          caseInsensitive
          confirmLabel="Cancel Invite"
          onCancel={() => setCancelInviteTarget(null)}
          onConfirm={confirmCancelInvite}
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
