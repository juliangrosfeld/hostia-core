'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';
import ManagerDashboard from '@/components/manager/ManagerDashboard';
import StaffProfile from '@/components/manager/StaffProfile';
import type { StaffMember } from '@/lib/staff-data';
import { useUser } from '@/lib/useUser';

export default function ManagerPage() {
  const router = useRouter();
  const { user, property } = useUser();
  const [view, setView] = useState<'dashboard' | 'staff-detail'>('dashboard');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

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

  const navUser = user
    ? { name: user.full_name, email: user.email, initials: user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase(), role: user.role }
    : null;
  const navProperty = property ? { name: property.name, primaryColor: property.primary_color } : null;

  return (
    <>
      <TopNav user={navUser} property={navProperty} />
      {view === 'dashboard' && (
        <ManagerDashboard
          onOpenStaff={openStaff}
          user={user}
          propertyName={property?.name ?? 'your property'}
        />
      )}
      {view === 'staff-detail' && selectedStaff && (
        <StaffProfile staff={selectedStaff} onBack={goBack} onViewAs={viewAsStaff} />
      )}
    </>
  );
}
