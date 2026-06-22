'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';
import ManagerDashboard from '@/components/manager/ManagerDashboard';
import StaffProfile from '@/components/manager/StaffProfile';
import type { StaffMember } from '@/lib/staff-data';

export default function ManagerPage() {
  const router = useRouter();
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

  return (
    <>
      <TopNav />
      {view === 'dashboard' && <ManagerDashboard onOpenStaff={openStaff} />}
      {view === 'staff-detail' && selectedStaff && (
        <StaffProfile staff={selectedStaff} onBack={goBack} onViewAs={viewAsStaff} />
      )}
    </>
  );
}
