'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Role = 'staff' | 'manager' | 'admin';

interface UserMenuProps {
  fullName: string;
  email: string;
  role: Role;
  initials: string;
  /** Open the menu above the avatar (e.g. when anchored at the bottom of a sidebar). */
  dropUp?: boolean;
  /** Which edge of the avatar the dropdown aligns to. */
  align?: 'left' | 'right';
}

const ROLE_LABEL: Record<Role, string> = {
  staff: 'Staff',
  manager: 'Manager',
  admin: 'Admin',
};

export default function UserMenu({ fullName, email, role, initials, dropUp = false, align = 'right' }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on click-outside and ESC.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="nav-avatar"
        onClick={() => setOpen((v) => !v)}
        title={fullName}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            [align]: 0,
            [dropUp ? 'bottom' : 'top']: 'calc(100% + 8px)',
            width: 240,
            background: '#fff',
            border: '1px solid var(--sand-deeper)',
            borderRadius: 8,
            boxShadow: '0 8px 28px rgba(5, 25, 86, 0.14)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div style={{ padding: '14px 16px' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--ocean-deep)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fullName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--ink-soft)',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {email}
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: 8,
                padding: '2px 9px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.02em',
                background: 'var(--sand-warm)',
                color: 'var(--ocean-deep)',
              }}
            >
              {ROLE_LABEL[role]}
            </span>
          </div>

          <div style={{ height: 1, background: 'var(--sand-deeper)' }} />

          {/* Admin-only link */}
          {role === 'admin' && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 16px',
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--ocean-deep)',
                textDecoration: 'none',
              }}
            >
              <Shield size={15} />
              Admin Panel
            </Link>
          )}

          {/* Log out */}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '11px 16px',
              border: 'none',
              borderTop: role === 'admin' ? '1px solid var(--sand-deeper)' : 'none',
              background: 'transparent',
              fontSize: 13.5,
              fontWeight: 600,
              color: 'var(--coral-deep)',
              cursor: signingOut ? 'default' : 'pointer',
              textAlign: 'left',
            }}
          >
            <LogOut size={15} />
            {signingOut ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  );
}
