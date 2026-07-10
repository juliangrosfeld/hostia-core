'use client'

import { useState, Suspense, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import TopNav from '@/components/TopNav'
import HomeView from '@/components/staff/HomeView'
import ModuleView from '@/components/staff/ModuleView'
import LessonView from '@/components/staff/LessonView'
import { type Module, type Lesson } from '@/lib/curriculum'
import { STAFF } from '@/lib/staff-data'
import { useUser } from '@/lib/useUser'
import { useCurriculum } from '@/lib/useCurriculum'
import { useLessonCompletions } from '@/lib/useLessonCompletions'
import { useHomeProgress } from '@/lib/useHomeProgress'
import { useStaffXPAndStreak } from '@/lib/useStaffXPAndStreak'
import { useScrollToTop } from '@/lib/useScrollToTop'
import { substitutePropertyDeep } from '@/lib/substitute-property'
import { DEMO_PROPERTY_ID } from '@/lib/config'

type StaffView = 'home' | 'module' | 'lesson'
type Phase = 'learn' | 'practice' | 'apply'

function StaffPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, property, loading } = useUser()
  const { curriculum: rawCurriculum, phaseData: rawPhaseData, loading: curriculumLoading } = useCurriculum()
  // Curriculum content is authored against the "[Property]" placeholder
  // (lesson intros, quiz questions, do/don't cards…). Substitute the real
  // property name ONCE at this boundary so no view below ever renders the
  // literal placeholder.
  const propertyName = property?.name ?? null
  const curriculum = useMemo(
    () => substitutePropertyDeep(rawCurriculum, propertyName),
    [rawCurriculum, propertyName],
  )
  const phaseData = useMemo(
    () => (rawPhaseData ? substitutePropertyDeep(rawPhaseData, propertyName) : null),
    [rawPhaseData, propertyName],
  )
  const asId = searchParams.get('as')
  const viewingAs = asId ? (STAFF.find((s) => s.id === asId) ?? null) : null
  // Real staff → their completed/started lessons; manager "view as" keeps mock status.
  const { completedKeys, startedKeys } = useLessonCompletions(!viewingAs)
  // The curriculum's hardcoded lesson.status values are preview data. Only a
  // manager "view as" preview and the Hostia Demo property may render them as
  // lesson state — a real account's badges/XP come from live completions only.
  const trustMockStatus = Boolean(viewingAs) || property?.id === DEMO_PROPERTY_ID
  // Hero data — fetched here and gated below, so HomeView paints its real hero
  // copy + XP/streak on the first render (no mock-then-real flicker).
  const { progress, loading: progressLoading } = useHomeProgress(viewingAs)
  const { totalXp: earnedXp, streak, loading: xpLoading } = useStaffXPAndStreak(viewingAs)
  const [view, setView] = useState<StaffView>('home')
  const [activeModule, setActiveModule] = useState<Module | null>(null)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('learn')

  // Every screen change starts at the top: home ↔ module ↔ lesson, a different
  // lesson in the same view, and Learn/Practice/Apply phase switches.
  useScrollToTop(view, activeModule?.id, activeLesson?.id, phase)

  // Bump last_active on every staff page load. Done server-side via the
  // heartbeat route (not a direct client write) so it's reliable and consistent
  // with how the manager/admin "active" counts read this column.
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    fetch('/api/heartbeat', { method: 'POST' }).catch(() => {})
  }, [userId])

  const goHome = () => { setView('home'); setActiveModule(null); setActiveLesson(null) }
  const openModule = (m: Module) => { setActiveModule(m); setView('module') }
  const openLesson = (m: Module, lesson: Lesson, index: number) => {
    setActiveModule(m); setActiveLesson(lesson); setActiveLessonIndex(index); setPhase('learn'); setView('lesson')
  }
  const backToModule = () => { setView('module'); setActiveLesson(null) }
  const clearViewAs = () => { router.push('/manager') }

  if (loading || curriculumLoading || progressLoading || xpLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand)' }}><div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--brand-deep)' }}>Loading…</div></div>
  }

  // 1-based position of the open module in the resolved curriculum (null if
  // it isn't in the list, e.g. opened from a phase layout that outran it).
  const activeModuleIndex = activeModule ? curriculum.findIndex((m) => m.id === activeModule.id) : -1
  const activeModuleNumber = activeModuleIndex >= 0 ? activeModuleIndex + 1 : null

  const navUser = user ? { name: user.full_name, email: user.email, initials: user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase(), role: user.role } : null
  const navProperty = property ? { name: property.name, primaryColor: property.primary_color, logoUrl: property.logo_url } : null
  // Expose the property's brand color to TopNav + hero via --brand-color.
  const brandColor = property?.primary_color || '#1B2B4B'

  return (
    <div style={{ '--brand-color': brandColor } as React.CSSProperties}>
      <TopNav viewingAs={viewingAs} onClearViewAs={clearViewAs} user={navUser} property={navProperty} />
      {view === 'home' && <HomeView curriculum={curriculum} phaseData={phaseData} progress={progress} earnedXp={earnedXp} streak={streak} onOpenModule={openModule} viewingAs={viewingAs} property={property} userName={user?.full_name ?? null} />}
      {view === 'module' && activeModule && <ModuleView module={activeModule} moduleNumber={activeModuleNumber} onBack={goHome} onOpenLesson={(lesson, index) => openLesson(activeModule, lesson, index)} completedKeys={completedKeys} startedKeys={startedKeys} trustMockStatus={trustMockStatus} />}
      {view === 'lesson' && activeModule && activeLesson && <LessonView module={activeModule} lesson={activeLesson} lessonIndex={activeLessonIndex} phase={phase} setPhase={setPhase} onBack={backToModule} completedKeys={completedKeys} trustMockStatus={trustMockStatus} propertyName={propertyName} />}
    </div>
  )
}

export default function StaffPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand)' }}><div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--brand-deep)' }}>Loading…</div></div>}>
      <StaffPageInner />
    </Suspense>
  )
}
