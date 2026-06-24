'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Layers, Store, ArrowRight, AlertCircle, Star } from 'lucide-react'

const DEMO_PROPERTY_ID = 'f86752e5-f7f1-46a2-acd3-90764ce1c403'

interface Property {
  id: string
  name: string
  venue_type: string | null
  primary_color: string | null
  active_module_count: number
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

function ClientCard({ property, isDemo }: { property: Property; isDemo: boolean }) {
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
          <b style={{ color: 'var(--ocean-deep)' }}>{property.active_module_count}</b> active module
          {property.active_module_count === 1 ? '' : 's'}
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

export default function AdminHomePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/properties')
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled) setError(data.error || 'Failed to load clients')
          return
        }
        if (!cancelled) setProperties(data.properties ?? [])
      } catch {
        if (!cancelled) setError('Network error — please try again')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Demo property first, then everyone else.
  const sorted = [...properties].sort((a, b) => {
    if (a.id === DEMO_PROPERTY_ID) return -1
    if (b.id === DEMO_PROPERTY_ID) return 1
    return 0
  })

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
            Clients
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
          Loading clients…
        </div>
      ) : sorted.length === 0 ? (
        <div
          style={{
            padding: '56px 24px',
            textAlign: 'center',
            background: 'white',
            border: '1px dashed var(--sand-deeper)',
            borderRadius: 16,
            color: 'var(--ink-soft)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ocean-deep)', marginBottom: 6 }}>
            No clients yet
          </div>
          <div style={{ fontSize: 14, marginBottom: 18 }}>Create your first client to get started.</div>
          <Link
            href="/admin/clients/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '10px 18px',
              borderRadius: 10,
              background: 'var(--ocean-deep)',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Plus size={16} /> New Client
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {sorted.map((p) => (
            <ClientCard key={p.id} property={p} isDemo={p.id === DEMO_PROPERTY_ID} />
          ))}
        </div>
      )}
    </div>
  )
}
