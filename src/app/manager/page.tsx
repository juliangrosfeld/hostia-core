'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';
import ManagerDashboard from '@/components/manager/ManagerDashboard';
import StaffProfile from '@/components/manager/StaffProfile';
import type { StaffMember } from '@/lib/staff-data';
import { useUser } from '@/lib/useUser';
import { useScrollToTop } from '@/lib/useScrollToTop';

export default function ManagerPage() {
  const router = useRouter();
  const { user, property, loading } = useUser();
  const [view, setView] = useState<'dashboard' | 'staff-detail'>('dashboard');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  // Whether the opened profile is a real staff member (real property) — the
  // profile then fetches actual module progress/sessions instead of mock.
  const [selectedLive, setSelectedLive] = useState(false);

  // Every screen change starts at the top: dashboard ↔ staff detail, and
  // switching between different staff profiles.
  useScrollToTop(view, selectedStaff?.id);

  // Manager/admin-only area. Unauthenticated users are bounced to /login;
  // staff users are sent back to /staff before any manager UI renders.
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return }
    if (user.role !== 'manager' && user.role !== 'admin') router.replace('/staff');
  }, [user, loading, router]);

  const openStaff = (s: StaffMember, live: boolean) => {
    setSelectedStaff(s);
    setSelectedLive(live);
    setView('staff-detail');
  };

  const goBack = () => {
    setView('dashboard');
    setSelectedStaff(null);
  };

  if (loading || !user || (user.role !== 'manager' && user.role !== 'admin')) {
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
    );
  }

  const navUser = user
    ? { name: user.full_name, email: user.email, initials: user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase(), role: user.role }
    : null;
  const navProperty = property ? { name: property.name, primaryColor: property.primary_color, logoUrl: property.logo_url } : null;
  // Expose the property's brand color to TopNav via --brand-color.
  const brandColor = property?.primary_color || '#1B2B4B';

  return (
    <div style={{ '--brand-color': brandColor } as React.CSSProperties}>
      <TopNav user={navUser} property={navProperty} />
      {view === 'dashboard' && <ManagerDashboard onOpenStaff={openStaff} />}
      {view === 'staff-detail' && selectedStaff && (
        <StaffProfile key={selectedStaff.id} staff={selectedStaff} onBack={goBack} propertyName={property?.name ?? null} live={selectedLive} />
      )}
    </div>
  );
}
