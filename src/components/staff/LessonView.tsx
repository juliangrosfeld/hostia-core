'use client';

import { ChevronLeft, Clock, Zap, BookOpen, Target, Play, CheckCircle2, RotateCcw } from 'lucide-react';
import type { Module, Lesson } from '@/lib/curriculum';
import { isLessonComplete } from '@/lib/useLessonCompletions';
import { logLessonCompletion } from '@/lib/completions';
import LearnPhase from './LearnPhase';
import PracticePhase from './PracticePhase';
import ApplyPhase from './ApplyPhase';

type Phase = 'learn' | 'practice' | 'apply';

function PhaseTab({
  id, current, setPhase, icon: Icon, label, desc,
}: {
  id: Phase; current: Phase; setPhase: (p: Phase) => void;
  icon: React.ElementType; label: string; desc: string;
}) {
  const isActive = current === id;
  return (
    <button
      className={`phase-tab${isActive ? ' is-active' : ''}`}
      onClick={() => setPhase(id)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={18} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{desc}</div>
        </div>
      </div>
    </button>
  );
}

interface LessonViewProps {
  module: Module;
  lesson: Lesson;
  lessonIndex: number;
  phase: Phase;
  setPhase: (p: Phase) => void;
  onBack: () => void;
  completedKeys: ReadonlySet<string>;
  // Trust the curriculum's hardcoded lesson.status (manager "view as" preview
  // and the demo property only) — real accounts read only completedKeys.
  trustMockStatus: boolean;
  propertyName?: string | null;
}

export default function LessonView({
  module, lesson, lessonIndex, phase, setPhase, onBack, completedKeys, trustMockStatus, propertyName,
}: LessonViewProps) {
  // Apply ("Live roleplay") only exists for lessons backed by a scenario.
  // Onboarding lessons have no scenarioId, so they show only Learn & Practice.
  const hasApply = Boolean(lesson.scenarioId);
  const effectivePhase: Phase = phase === 'apply' && !hasApply ? 'practice' : phase;

  // Same completion check as the module lesson list — reused, not re-derived.
  const isDone = isLessonComplete(module.id, lesson, completedKeys, trustMockStatus);

  // Completion must not depend on WHICH control moved the person off a phase.
  // Phases with no pass gate are finished by leaving them: Learn (reading has
  // no assessment) and a quiz-less Practice. Pass-gated phases (quiz Practice,
  // Apply roleplay) log inside their components on a genuine pass — never here.
  // Every phase switch — top tab bar or bottom CTA — goes through changePhase,
  // so both controls share this one logging path.
  const logPhaseLeave = (from: Phase) => {
    if (from === 'learn') {
      logLessonCompletion({ module_id: module.id, lesson_id: lesson.id, phase: 'learn' });
    } else if (from === 'practice' && lesson.quiz.length === 0) {
      logLessonCompletion({ module_id: module.id, lesson_id: lesson.id, phase: 'practice' });
    }
  };
  const changePhase = (next: Phase) => {
    if (next !== effectivePhase) logPhaseLeave(effectivePhase);
    setPhase(next);
  };

  return (
    <div className="page animate-fade-up">
      <div className="container">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={16} /> {module.title}
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="label-mono">
              Lesson {lessonIndex + 1} of {module.lessons.length}
            </div>
            <h1 className="display" style={{ fontSize: 36, color: 'var(--brand-deep)', margin: '6px 0 0', lineHeight: 1.1 }}>
              {lesson.title}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 16, color: 'var(--ink-soft)', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} /> {lesson.duration}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={13} color="var(--brand)" /> {lesson.xp} XP
            </span>
          </div>
        </div>

        {/* Completed banner — this lesson was already finished. Redoing it is
            always allowed (re-completing is idempotent server-side). */}
        {isDone && (
          <div className="lesson-done-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <CheckCircle2 size={20} color="var(--sage-deep)" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sage-deep)' }}>Completed</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  You&apos;ve finished this lesson. Redo any phase to sharpen it.
                </div>
              </div>
            </div>
            <button
              className="btn-ghost lesson-redo-btn"
              onClick={() => changePhase('learn')}
            >
              <RotateCcw size={13} /> Redo
            </button>
          </div>
        )}

        {/* Phase nav */}
        <div className="phase-nav">
          <PhaseTab id="learn" current={effectivePhase} setPhase={changePhase} icon={BookOpen} label="Learn" desc="Read & absorb" />
          <PhaseTab id="practice" current={effectivePhase} setPhase={changePhase} icon={Target} label="Practice" desc="Drill & quiz" />
          {hasApply && (
            <PhaseTab id="apply" current={effectivePhase} setPhase={changePhase} icon={Play} label="Apply" desc="Live roleplay" />
          )}
        </div>

        {effectivePhase === 'learn' && (
          <LearnPhase lesson={lesson} moduleId={module.id} onAdvance={() => changePhase('practice')} />
        )}
        {effectivePhase === 'practice' && (
          <PracticePhase
            lesson={lesson}
            moduleId={module.id}
            onAdvance={hasApply ? () => changePhase('apply') : () => { logPhaseLeave('practice'); onBack(); }}
          />
        )}
        {effectivePhase === 'apply' && hasApply && (
          <ApplyPhase lesson={lesson} moduleId={module.id} onComplete={onBack} propertyName={propertyName} />
        )}
      </div>
    </div>
  );
}
