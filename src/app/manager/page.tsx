'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';
import ManagerDashboard from '@/components/manager/ManagerDashboard';
import StaffProfile from '@/components/manager/StaffProfile';
import type { StaffMember } from '@/lib/staff-data';
import { useUser } from '@/lib/useUser';

export default function ManagerPage() {
  const router = useRouter();
  const { user, property, loading } = useUser();
  const [view, setView] = useState<'dashboard' | 'staff-detail'>('dashboard');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Manager/admin-only area. Unauthenticated users are bounced to /login;
  // staff users are sent back to /staff before any manager UI renders.
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return }
    if (user.role !== 'manager' && user.role !== 'admin') router.replace('/staff');
  }, [user, loading, router]);

  const openStaff = (s: StaffMember) => {
    setSelectedStaff(s);
    setView('staff-detail');
  };

  const goBack = () => {
    setView('dashboard');
    setSelectedStaff(null);
  };

  const viewAsStaff = (s: StaffMember) => {
    router.push(`/staff?as=${s.id}`);
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
  const navProperty = property ? { name: property.name, primaryColor: property.primary_color } : null;

  return (
    <>
      <TopNav user={navUser} property={navProperty} />
      {view === 'dashboard' && <ManagerDashboard onOpenStaff={openStaff} />}
      {view === 'staff-detail' && selectedStaff && (
        <StaffProfile staff={selectedStaff} onBack={goBack} onViewAs={viewAsStaff} />
      )}
    </>
  );
}
