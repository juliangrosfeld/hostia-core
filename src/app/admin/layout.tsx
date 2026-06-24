'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, UserPlus, Library, Utensils } from 'lucide-react'
import { useUser } from '@/lib/useUser'

const NAV = [
  { href: '/admin', label: 'Home', icon: Home },
  { href: '/admin/clients/new', label: 'New Client', icon: UserPlus },
  { href: '/admin/library', label: 'Module Library', icon: Library },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useUser()

  // Admin-only area. Unauthenticated users are already bounced to /login by
  // middleware; here we send any non-admin signed-in user back to /staff.
  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (user.role !== 'admin') router.replace('/staff')
  }, [loading, user, router])

  if (loading || !user || user.role !== 'admin') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--sand)',
        }}
      >
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--ocean-deep)' }}>
          Loading…
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--sand)' }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 232,
          flexShrink: 0,
          background: '#051956',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px 24px' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'rgba(245,166,35,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F5A623',
              flexShrink: 0,
            }}
          >
            <Utensils size={18} />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>GLAD AI</div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              Hostia Admin
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '10px 12px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: active ? '#051956' : 'rgba(255,255,255,0.78)',
                  background: active ? '#F5A623' : 'transparent',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '8px', fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>
          {user.full_name}
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  )
}
