'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';
import HomeView from '@/components/staff/HomeView';
import ModuleView from '@/components/staff/ModuleView';
import LessonView from '@/components/staff/LessonView';
import { CURRICULUM, type Module, type Lesson } from '@/lib/curriculum';
import { STAFF } from '@/lib/staff-data';

type StaffView = 'home' | 'module' | 'lesson';
type Phase = 'learn' | 'practice' | 'apply';

function StaffPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Resolve staff member from ?as= param (for "view as" from manager)
  const asId = searchParams.get('as');
  const viewingAs = asId ? (STAFF.find((s) => s.id === asId) ?? null) : null;

  const [view, setView] = useState<StaffView>('home');
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('learn');

  const goHome = () => {
    setView('home');
    setActiveModule(null);
    setActiveLesson(null);
  };

  const openModule = (m: Module) => {
    setActiveModule(m);
    setView('module');
  };

  const openLesson = (m: Module, lesson: Lesson, index: number) => {
    setActiveModule(m);
    setActiveLesson(lesson);
    setActiveLessonIndex(index);
    setPhase('learn');
    setView('lesson');
  };

  const backToModule = () => {
    setView('module');
    setActiveLesson(null);
  };

  const clearViewAs = () => {
    router.push('/manager');
  };

  return (
    <>
      <TopNav viewingAs={viewingAs} onClearViewAs={clearViewAs} />

      {view === 'home' && (
        <HomeView
          curriculum={CURRICULUM}
          onOpenModule={openModule}
          viewingAs={viewingAs}
        />
      )}

      {view === 'module' && activeModule && (
        <ModuleView
          module={activeModule}
          onBack={goHome}
          onOpenLesson={(lesson, index) => openLesson(activeModule, lesson, index)}
        />
      )}

      {view === 'lesson' && activeModule && activeLesson && (
        <LessonView
          module={activeModule}
          lesson={activeLesson}
          lessonIndex={activeLessonIndex}
          phase={phase}
          setPhase={setPhase}
          onBack={backToModule}
        />
      )}
    </>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand)' }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--brand-deep)' }}>Loading…</div>
      </div>
    }>
      <StaffPageInner />
    </Suspense>
  );
}
