'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, GraduationCap, Eye } from 'lucide-react';
import { PROPERTY } from '@/lib/config';
import type { StaffMember } from '@/lib/staff-data';

interface TopNavProps {
  viewingAs?: StaffMember | null;
  onClearViewAs?: () => void;
}

export default function TopNav({ viewingAs, onClearViewAs }: TopNavProps) {
  const pathname = usePathname();
  const isManager = pathname.startsWith('/manager');
  const isStaff = pathname.startsWith('/staff');

  return (
    <>
      <div className="top-nav">
        <div className="top-nav-inner">
          {/* Brand */}
          <Link href="/manager" className="brand" style={{ textDecoration: 'none' }}>
            <span className="display brand-name">Hostia<span className="brand-dot">·</span></span>
            <span className="brand-tag">BY GLAD AI</span>
            <div className="property-pill" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img
                src="/Brgrlogo.png"
                alt="Brgr Haus"
                style={{ height: 18, width: 18, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
              />
              {PROPERTY.name}
            </div>
          </Link>

          {/* Right side */}
          <div className="nav-right">
            {/* Viewing-as badge */}
            {viewingAs && (
              <div className="viewing-as">
                <Eye size={12} />
                <span>Viewing as <b>{viewingAs.name}</b></span>
                <button
                  className="x-btn"
                  onClick={onClearViewAs}
                  aria-label="Exit staff view"
                >
                  ×
                </button>
              </div>
            )}

            {/* Role switcher — hidden on mobile, replaced by bottom tab bar */}
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

            {/* Manager avatar */}
            <div className="nav-avatar" title="Omar Elias — Manager">
              OE
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tab bar — mobile only, replaces role switcher */}
      <nav className="bottom-tab-bar">
        <Link
          href="/staff"
          className={`bottom-tab${isStaff ? ' is-active' : ''}`}
        >
          <GraduationCap size={22} />
          Staff
        </Link>
        <Link
          href="/manager"
          className={`bottom-tab${isManager ? ' is-active' : ''}`}
        >
          <BarChart3 size={22} />
          Manager
        </Link>
      </nav>
    </>
  );
}
