'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, GraduationCap, Eye } from 'lucide-react';
import { PROPERTY } from '@/lib/config';
import type { StaffMember } from '@/lib/staff-data';

interface TopNavProps {
  viewingAs?: StaffMember | null;
  onClearViewAs?: () => void;
  user?: { name: string; initials: string; role: string } | null;
  property?: { name: string; primaryColor: string } | null;
}

export default function TopNav({ viewingAs, onClearViewAs, user, property }: TopNavProps) {
  const pathname = usePathname();
  const isManager = pathname.startsWith('/manager');
  const isStaff = pathname.startsWith('/staff');

  const propertyName = property?.name ?? PROPERTY.name;
  const initials = user?.initials ?? 'OE';
  const userName = user?.name ?? 'Manager';

  return (
    <>
      <div className="top-nav">
        <div className="top-nav-inner">

          {/* Left: Hostia logo + BY GLAD AI */}
          <Link href="/manager" className="brand" style={{ textDecoration: 'none' }}>
            <img
              src="/hostia-logo.png"
              alt="Hostia"
              style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            />
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
              <Link
                href="/manager"
                className={isManager ? 'is-active' : ''}
                style={{ textDecoration: 'none' }}
              >
                <BarChart3 size={13} />
                Manager
              </Link>
              <Link
                href="/staff"
                className={isStaff ? 'is-active' : ''}
                style={{ textDecoration: 'none' }}
              >
                <GraduationCap size={13} />
                Staff
              </Link>
            </div>

            <div className="nav-avatar" title={userName}>
              {initials}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav className="bottom-tab-bar">
        <Link href="/staff" className={`bottom-tab${isStaff ? ' is-active' : ''}`}>
          <GraduationCap size={22} />
          Staff
        </Link>
        <Link href="/manager" className={`bottom-tab${isManager ? ' is-active' : ''}`}>
          <BarChart3 size={22} />
          Manager
        </Link>
      </nav>
    </>
  );
}
