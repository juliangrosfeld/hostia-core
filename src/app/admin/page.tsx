'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Layers, Store, ArrowRight, AlertCircle, Star, Users,
  Building2, GraduationCap, MessageSquare, DollarSign,
} from 'lucide-react'

const DEMO_PROPERTY_ID = 'f86752e5-f7f1-46a2-acd3-90764ce1c403'

// ── Pricing ───────────────────────────────────────────────────────────────────
// Active staff (signed in within the last 30 days) drives the tier. 250+ is
// bespoke — shown as "Custom" and excluded from the auto-calculated MRR.
const PRICING_TIERS = [
  { min: 1, max: 10, base: 249, perUser: 20 },
  { min: 11, max: 20, base: 349, perUser: 20 },
  { min: 21, max: 30, base: 449, perUser: 20 },
  { min: 31, max: 50, base: 599, perUser: 20 },
  { min: 51, max: 75, base: 799, perUser: 20 },
  { min: 76, max: 100, base: 999, perUser: 20 },
  { min: 101, max: 150, base: 1299, perUser: 20 },
  { min: 151, max: 250, base: 1799, perUser: 20 },
]

function calculateMonthlyRevenue(activeStaff: number): number {
  if (activeStaff === 0) return 0
  const tier = PRICING_TIERS.find(t => activeStaff >= t.min && activeStaff <= t.max)
  if (!tier) return 0 // 250+ = custom, show as 0 with "Custom" label
  return tier.base + (activeStaff * tier.perUser)
}

// 250+ active staff = no matching tier = custom pricing.
function isCustom(activeStaff: number): boolean {
  return activeStaff > 0 && !PRICING_TIERS.some(t => activeStaff >= t.min && activeStaff <= t.max)
}

function tierLabel(activeStaff: number): string {
  if (isCustom(activeStaff)) return 'Custom'
  const tier = PRICING_TIERS.find(t => activeStaff >= t.min && activeStaff <= t.max)
  return tier ? `${tier.min}–${tier.max} staff` : '—'
}

type Health = 'green' | 'yellow' | 'red'
const HEALTH_COLOR: Record<Health, string> = {
  green: '#3FA66A',
  yellow: '#E6A700',
  red: '#E07A5F',
}
function healthOf(lastActivityDays: number | null): Health {
  if (lastActivityDays === null || lastActivityDays >= 30) return 'red'
  if (lastActivityDays >= 7) return 'yellow'
  return 'green'
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface DashboardClient {
  id: string
  name: string
  venue_type: string | null
  primary_color: string | null
  totalStaff: number
  activeStaff: number
  lessonsThisMonth: number
  roleplaysThisMonth: number
  activeModuleCount: number
  lastActivityDays: number | null
}

const VENUE_LABEL: Record<string, string> = {
  'casual-dining': 'Casual Dining',
  'fine-dining': 'Fine Dining',
  'fast-casual': 'Fast Casual',
}

function venueLabel(v: string | null): string {
  if (!v) return 'Unspecified'
  return VENUE_LABEL[v] ?? v
}

function money(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}

// ── Stat card (top row) ─────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, note,
}: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid var(--sand-deeper)',
        boxShadow: '0 1px 2px rgba(5,25,86,0.04)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-soft)',
        }}
      >
        <span style={{ color: 'var(--gold-deep)', display: 'inline-flex' }}>{icon}</span>
        {label}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: 'var(--ocean-deep)',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {note && <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{note}</div>}
    </div>
  )
}

// ── Client card (Section 3 — unchanged from before) ─────────────────────────────
function ClientCard({ property, isDemo }: { property: DashboardClient; isDemo: boolean }) {
  const accent = property.primary_color || '#051956'
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        border: isDemo ? '1.5px solid #F5A623' : '1px solid var(--sand-deeper)',
        boxShadow: isDemo
          ? '0 8px 28px -10px rgba(245,166,35,0.45)'
          : '0 1px 2px rgba(5,25,86,0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: 4, background: accent }} />
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--ocean-deep)', letterSpacing: '-0.01em' }}>
                {property.name}
              </h3>
              {isDemo && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#8a6000',
                    background: 'rgba(245,166,35,0.18)',
                    padding: '3px 8px',
                    borderRadius: 999,
                  }}
                >
                  <Star size={11} /> Demo
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink-soft)',
              }}
            >
              <Store size={13} /> {venueLabel(property.venue_type)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--ink-soft)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <Layers size={15} color="var(--gold-deep)" />
          <b style={{ color: 'var(--ocean-deep)' }}>{property.activeModuleCount}</b> active module
          {property.activeModuleCount === 1 ? '' : 's'}
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--ink-soft)',
            fontVariantNumeric: 'tabular-nums',
            marginTop: -8,
          }}
        >
          <Users size={15} color="var(--gold-deep)" />
          <b style={{ color: 'var(--ocean-deep)' }}>{property.activeStaff}</b> active user
          {property.activeStaff === 1 ? '' : 's'}
        </div>

        <Link
          href={`/admin/clients/${property.id}`}
          style={{
            marginTop: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            padding: '10px 16px',
            borderRadius: 10,
            background: 'var(--ocean-deep)',
            color: 'white',
            fontSize: 13.5,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Manage <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  )
}

// ── Revenue table row ───────────────────────────────────────────────────────────
function RevenueRow({ c, last }: { c: DashboardClient; last: boolean }) {
  const custom = isCustom(c.activeStaff)
  const revenue = calculateMonthlyRevenue(c.activeStaff)
  const health = healthOf(c.lastActivityDays)
  const cell: React.CSSProperties = {
    padding: '14px 18px',
    borderBottom: last ? 'none' : '1px solid var(--sand-deeper)',
    fontSize: 13.5,
    color: 'var(--ocean-deep)',
    verticalAlign: 'middle',
  }
  return (
    <tr
      style={{ transition: 'background 0.12s ease' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(5,25,86,0.025)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ ...cell, fontWeight: 700 }}>{c.name}</td>
      <td style={{ ...cell, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-soft)' }}>
        <b style={{ color: 'var(--ocean-deep)' }}>{c.activeStaff}</b> / {c.totalStaff}
      </td>
      <td style={{ ...cell, color: 'var(--ink-soft)' }}>{tierLabel(c.activeStaff)}</td>
      <td style={{ ...cell, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {custom ? 'Custom' : `${money(revenue)}/mo`}
      </td>
      <td style={cell}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: HEALTH_COLOR[health],
              flexShrink: 0,
            }}
          />
        </span>
      </td>
      <td style={{ ...cell, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-soft)' }}>
        {c.lessonsThisMonth}
      </td>
      <td style={{ ...cell, textAlign: 'right' }}>
        <Link
          href={`/admin/clients/${c.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 8,
            background: 'var(--ocean-deep)',
            color: 'white',
            fontSize: 12.5,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Manage <ArrowRight size={13} />
        </Link>
      </td>
    </tr>
  )
}

export default function AdminHomePage() {
  const [clients, setClients] = useState<DashboardClient[]>([])
  const [demo, setDemo] = useState<DashboardClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/dashboard')
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled) setError(data.error || 'Failed to load dashboard')
          return
        }
        if (!cancelled) {
          setClients(data.clients ?? [])
          setDemo(data.demo ?? null)
        }
      } catch {
        if (!cancelled) setError('Network error — please try again')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ── Aggregates for the stats row ──────────────────────────────────────────────
  const activeClients = clients.length
  const totalStaff = clients.reduce((s, c) => s + c.totalStaff, 0)
  const monthlyLessons = clients.reduce((s, c) => s + c.lessonsThisMonth, 0)
  const monthlyRoleplays = clients.reduce((s, c) => s + c.roleplaysThisMonth, 0)
  const mrr = clients.reduce((s, c) => s + calculateMonthlyRevenue(c.activeStaff), 0)
  const hasCustom = clients.some((c) => isCustom(c.activeStaff))

  // Highest-paying first. Custom clients (250+) sit at the top.
  const revenueSorted = [...clients].sort((a, b) => {
    const va = isCustom(a.activeStaff) ? Infinity : calculateMonthlyRevenue(a.activeStaff)
    const vb = isCustom(b.activeStaff) ? Infinity : calculateMonthlyRevenue(b.activeStaff)
    return vb - va
  })

  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px 18px',
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ink-soft)',
    borderBottom: '1px solid var(--sand-deeper)',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 32px 80px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
            }}
          >
            GLAD AI
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 800, color: 'var(--ocean-deep)', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
        </div>
        <Link
          href="/admin/clients/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '11px 18px',
            borderRadius: 10,
            background: '#F5A623',
            color: '#051956',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(245,166,35,0.35)',
          }}
        >
          <Plus size={16} /> New Client
        </Link>
      </div>

      {error ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 24px',
            borderRadius: 14,
            background: 'rgba(224,122,95,0.08)',
            border: '1px solid rgba(224,122,95,0.25)',
            color: 'var(--coral-deep)',
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          <AlertCircle size={20} /> {error}
        </div>
      ) : loading ? (
        <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 15 }}>
          Loading dashboard…
        </div>
      ) : (
        <>
          {/* ── Section 1 — Stats row ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <StatCard icon={<Building2 size={14} />} label="Active Clients" value={String(activeClients)} />
            <StatCard icon={<Users size={14} />} label="Total Staff" value={String(totalStaff)} />
            <StatCard icon={<GraduationCap size={14} />} label="Monthly Lessons" value={String(monthlyLessons)} />
            <StatCard icon={<MessageSquare size={14} />} label="Monthly Roleplays" value={String(monthlyRoleplays)} />
            <StatCard
              icon={<DollarSign size={14} />}
              label="MRR"
              value={`${money(mrr)}/mo`}
              note={hasCustom ? '* excludes custom pricing clients' : undefined}
            />
          </div>

          {/* ── Section 2 — Client revenue table ── */}
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                margin: '0 0 14px',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--ocean-deep)',
                letterSpacing: '-0.01em',
              }}
            >
              Client Revenue
            </h2>
            {revenueSorted.length === 0 ? (
              <div
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: 'white',
                  border: '1px dashed var(--sand-deeper)',
                  borderRadius: 16,
                  color: 'var(--ink-soft)',
                  fontSize: 14,
                }}
              >
                No paying clients yet. Create one to start tracking revenue.
              </div>
            ) : (
              <div
                style={{
                  background: 'white',
                  border: '1px solid var(--sand-deeper)',
                  borderRadius: 16,
                  boxShadow: '0 1px 2px rgba(5,25,86,0.04)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                    <thead>
                      <tr>
                        <th style={th}>Property</th>
                        <th style={th}>Active / Total</th>
                        <th style={th}>Tier</th>
                        <th style={th}>Monthly Value</th>
                        <th style={th}>Health</th>
                        <th style={th}>Lessons (mo)</th>
                        <th style={{ ...th, textAlign: 'right' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueSorted.map((c, i) => (
                        <RevenueRow key={c.id} c={c} last={i === revenueSorted.length - 1} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 3 — Client cards ── */}
          <h2
            style={{
              margin: '0 0 14px',
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--ocean-deep)',
              letterSpacing: '-0.01em',
            }}
          >
            Clients
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {demo && <ClientCard key={demo.id} property={demo} isDemo />}
            {clients.map((p) => (
              <ClientCard key={p.id} property={p} isDemo={false} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
