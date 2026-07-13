'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, GraduationCap, Eye } from 'lucide-react';
import type { StaffMember } from '@/lib/staff-data';
import UserMenu from '@/components/UserMenu';

interface TopNavProps {
  viewingAs?: StaffMember | null;
  onClearViewAs?: () => void;
  user?: { name: string; email: string; initials: string; role: 'staff' | 'manager' | 'admin' } | null;
  property?: { name: string; primaryColor: string; logoUrl?: string | null } | null;
}

export default function TopNav({ viewingAs, onClearViewAs, user, property }: TopNavProps) {
  const pathname = usePathname();
  const isManager = pathname.startsWith('/manager');
  const isStaff = pathname.startsWith('/staff');
  // Staff users may only see the Staff tab; manager/admin can preview as staff.
  const canManage = user?.role === 'manager' || user?.role === 'admin';

  // No placeholder fallback — with no property loaded, the pill is hidden.
  const propertyName = property?.name ?? null;
  const initials = user?.initials ?? 'OE';
  const userName = user?.name ?? 'Manager';

  return (
    <>
      <div className="top-nav">
        <div className="top-nav-inner">

          {/* Left: BY GLAD AI wordmark (links home) */}
          <Link href={canManage ? '/manager' : '/staff'} className="brand" style={{ textDecoration: 'none' }}>
            <span className="brand-tag">BY GLAD AI</span>
          </Link>

          {/* Center: property logo directly next to the property name.
              Non-interactive (like the pill before it) so the centered block
              never intercepts clicks meant for the nav controls around it. */}
          {(property?.logoUrl || propertyName) && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                pointerEvents: 'none',
              }}
            >
              {property?.logoUrl && (
                <img
                  src={property.logoUrl}
                  alt={propertyName ?? 'Property logo'}
                  className="client-logo"
                  style={{ height: 32, width: 'auto', objectFit: 'contain' }}
                />
              )}
              {propertyName && (
                <div
                  className="property-pill"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    margin: 0,
                    // Brand-colored accent: text + tinted background/border derived
                    // from --brand-color (set on the page wrapper; #1B2B4B fallback).
                    color: 'var(--brand-color, #1B2B4B)',
                    background: 'color-mix(in srgb, var(--brand-color, #1B2B4B) 9%, white)',
                    borderColor: 'color-mix(in srgb, var(--brand-color, #1B2B4B) 22%, white)',
                  }}
                >
                  {propertyName}
                </div>
              )}
            </div>
          )}

          {/* Right: role switcher + avatar */}
          <div className="nav-right">
            {viewingAs && (
              <div className="viewing-as">
                <Eye size={12} />
                <span>Viewing as <b>{viewingAs.name}</b></span>
                <button
                  className="x-btn"
                  onClick={onClearViewAs}
                  aria-label="Exit staff view"
                >
                  x
                </button>
              </div>
            )}

            <div className="role-switcher">
              {canManage && (
                <Link
                  href="/manager"
                  className={isManager ? 'is-active' : ''}
                  style={{ textDecoration: 'none' }}
                >
                  <BarChart3 size={13} />
                  Manager
                </Link>
              )}
              <Link
                href="/staff"
                className={isStaff ? 'is-active' : ''}
                style={{ textDecoration: 'none' }}
              >
                <GraduationCap size={13} />
                Staff
              </Link>
              {/* Admin tools live in the Admin Panel (UserMenu) — the old
                  "Library" tab pointed at a deleted demo-only page. */}
            </div>

            {user ? (
              <UserMenu
                fullName={user.name}
                email={user.email}
                role={user.role}
                initials={user.initials}
              />
            ) : (
              <div className="nav-avatar" title={userName}>
                {initials}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav className="bottom-tab-bar">
        <Link href="/staff" className={`bottom-tab${isStaff ? ' is-active' : ''}`}>
          <GraduationCap size={22} />
          Staff
        </Link>
        {canManage && (
          <Link href="/manager" className={`bottom-tab${isManager ? ' is-active' : ''}`}>
            <BarChart3 size={22} />
            Manager
          </Link>
        )}
      </nav>
    </>
  );
}
