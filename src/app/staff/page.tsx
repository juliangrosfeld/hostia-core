'use client'

import { useState, Suspense, useEffect } from 'react'
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

type StaffView = 'home' | 'module' | 'lesson'
type Phase = 'learn' | 'practice' | 'apply'

function StaffPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, property, loading } = useUser()
  const { curriculum, loading: curriculumLoading } = useCurriculum()
  const asId = searchParams.get('as')
  const viewingAs = asId ? (STAFF.find((s) => s.id === asId) ?? null) : null
  // Real staff → their completed lessons; manager "view as" keeps mock status.
  const { completedKeys } = useLessonCompletions(!viewingAs)
  const [view, setView] = useState<StaffView>('home')
  const [activeModule, setActiveModule] = useState<Module | null>(null)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('learn')

  // Bump last_active on every staff page load. Done server-side via the
  // heartbeat route (not a direct client write) so it's reliable and consistent
  // with how the manager/admin "active" counts read this column.
  useEffect(() => {
    if (!user) return
    fetch('/api/heartbeat', { method: 'POST' }).catch(() => {})
  }, [user?.id])

  const goHome = () => { setView('home'); setActiveModule(null); setActiveLesson(null) }
  const openModule = (m: Module) => { setActiveModule(m); setView('module') }
  const openLesson = (m: Module, lesson: Lesson, index: number) => {
    setActiveModule(m); setActiveLesson(lesson); setActiveLessonIndex(index); setPhase('learn'); setView('lesson')
  }
  const backToModule = () => { setView('module'); setActiveLesson(null) }
  const clearViewAs = () => { router.push('/manager') }

  if (loading || curriculumLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand)' }}><div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--brand-deep)' }}>Loading…</div></div>
  }

  const navUser = user ? { name: user.full_name, email: user.email, initials: user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase(), role: user.role } : null
  const navProperty = property ? { name: property.name, primaryColor: property.primary_color } : null

  return (
    <>
      <TopNav viewingAs={viewingAs} onClearViewAs={clearViewAs} user={navUser} property={navProperty} />
      {view === 'home' && <HomeView curriculum={curriculum} onOpenModule={openModule} viewingAs={viewingAs} property={property} />}
      {view === 'module' && activeModule && <ModuleView module={activeModule} onBack={goHome} onOpenLesson={(lesson, index) => openLesson(activeModule, lesson, index)} completedKeys={completedKeys} />}
      {view === 'lesson' && activeModule && activeLesson && <LessonView module={activeModule} lesson={activeLesson} lessonIndex={activeLessonIndex} phase={phase} setPhase={setPhase} onBack={backToModule} completedKeys={completedKeys} />}
    </>
  )
}

export default function StaffPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand)' }}><div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--brand-deep)' }}>Loading…</div></div>}>
      <StaffPageInner />
    </Suspense>
  )
}
