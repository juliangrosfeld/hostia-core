'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, GraduationCap, Eye, BookOpen } from 'lucide-react';
import { PROPERTY } from '@/lib/config';
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
  const isLibrary = pathname.startsWith('/admin/library');
  const isAdmin = user?.role === 'admin';
  // Staff users may only see the Staff tab; manager/admin can preview as staff.
  const canManage = user?.role === 'manager' || user?.role === 'admin';

  const propertyName = property?.name ?? PROPERTY.name;
  const initials = user?.initials ?? 'OE';
  const userName = user?.name ?? 'Manager';

  return (
    <>
      <div className="top-nav">
        <div className="top-nav-inner">

          {/* Left: BY GLAD AI. Property logo intentionally not rendered for now
              (still saved in the DB via the admin upload — just hidden here). */}
          <Link href={canManage ? '/manager' : '/staff'} className="brand" style={{ textDecoration: 'none' }}>
            <span className="brand-tag">BY GLAD AI</span>
          </Link>

          {/* Center: property pill */}
          <div
            className="property-pill"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              margin: 0,
              pointerEvents: 'none',
              // Brand-colored accent: text + tinted background/border derived
              // from --brand-color (set on the page wrapper; #1B2B4B fallback).
              color: 'var(--brand-color, #1B2B4B)',
              background: 'color-mix(in srgb, var(--brand-color, #1B2B4B) 9%, white)',
              borderColor: 'color-mix(in srgb, var(--brand-color, #1B2B4B) 22%, white)',
            }}
          >
            {propertyName}
          </div>

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
              {isAdmin && (
                <Link
                  href="/admin/library"
                  className={isLibrary ? 'is-active' : ''}
                  style={{ textDecoration: 'none' }}
                >
                  <BookOpen size={13} />
                  Library
                </Link>
              )}
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
