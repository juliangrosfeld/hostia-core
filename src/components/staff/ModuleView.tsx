'use client';

import { ChevronLeft, Clock, Zap, Check, ChevronRight, Trophy } from 'lucide-react';
import {
  Hand, BookOpen, MessageSquare, Shield, Users, Brain, House, Eye,
} from 'lucide-react';
import type { Module, Lesson } from '@/lib/curriculum';

// Icon map matching curriculum iconName strings
const ICON_MAP: Record<string, React.ElementType> = {
  Hand,
  BookOpen,
  MessageSquare,
  Shield,
  Users,
  Brain,
  House,
  Eye,
};

function LessonRow({
  num, lesson, onClick,
}: {
  num: number; lesson: Lesson; onClick: () => void;
}) {
  const isDone = lesson.status === 'completed';
  const isCurrent = lesson.status === 'current';

  return (
    <div
      className={`lesson-row${isCurrent ? ' is-current' : ''}`}
      onClick={onClick}
    >
      <div className={`lesson-num${isDone ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}>
        {isDone ? <Check size={16} /> : num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lesson-title-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="lesson-title" style={{ fontWeight: 700, fontSize: 15 }}>{lesson.title}</span>
          {isCurrent && <span className="badge-pill" style={{ flexShrink: 0 }}>Continue</span>}
          {isDone && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sage-deep)', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
              ✓ Done
            </span>
          )}
        </div>
        <div className="lesson-desc" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{lesson.desc}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink-soft)', fontSize: 12, flexShrink: 0 }}>
        <span className="lesson-clock" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} /> {lesson.duration}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={12} color="var(--brand)" /> {lesson.xp} XP
        </span>
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

interface ModuleViewProps {
  module: Module;
  onBack: () => void;
  onOpenLesson: (lesson: Lesson, index: number) => void;
}

export default function ModuleView({ module, onBack, onOpenLesson }: ModuleViewProps) {
  const Icon = ICON_MAP[module.iconName] ?? Hand;
  const allDone = module.completedLessons === module.totalLessons;

  return (
    <div className="page animate-fade-up">
      <div className="container">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={16} /> All modules
        </button>

        {/* Module hero */}
        <div
          className="module-hero"
          style={{
            background: `linear-gradient(135deg, ${module.color}15 0%, ${module.color}05 100%)`,
            borderColor: `${module.color}30`,
          }}
        >
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: module.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={30} color="white" />
            </div>
            <div>
              <div className="label-mono">
                Module {['greetings','service-flow','language','complaints','floor','guest-psychology'].indexOf(module.id) + 1}
              </div>
              <h1 className="display" style={{ fontSize: 36, color: 'var(--brand-deep)', margin: '6px 0 10px', lineHeight: 1.1 }}>
                {module.title}
              </h1>
              <p style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.55, maxWidth: 600, margin: 0 }}>
                {module.subtitle}
              </p>
            </div>
          </div>

          <div className="module-stats">
            <div>
              <div className="label-mono">Progress</div>
              <div className="stat-big">{Math.round(module.progress * 100)}%</div>
            </div>
            <div className="div-vert" />
            <div>
              <div className="label-mono">Lessons</div>
              <div className="stat-big">{module.completedLessons}/{module.totalLessons}</div>
            </div>
            <div className="div-vert" />
            <div>
              <div className="label-mono">XP available</div>
              <div className="stat-big" style={{ color: 'var(--brand)' }}>{module.xpTotal}</div>
            </div>
          </div>
        </div>

        {/* Lessons */}
        <div style={{ marginTop: 40 }}>
          <h2 className="display" style={{ fontSize: 22, marginBottom: 20, color: 'var(--brand-deep)' }}>
            Lessons
          </h2>
          <div className="lesson-list">
            {module.lessons.map((l, i) => (
              <LessonRow
                key={l.id}
                num={i + 1}
                lesson={l}
                onClick={() => onOpenLesson(l, i)}
              />
            ))}
          </div>

          {/* Exam card */}
          <div style={{ marginTop: 20 }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 12, color: 'var(--brand-deep)' }}>
              Final exam
            </h2>
            <div
              className="exam-card"
              onClick={() => undefined /* TODO: exam flow */}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: allDone ? 'var(--brand)' : 'var(--sand-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trophy size={22} color={allDone ? 'var(--brand-deep)' : 'var(--ink-soft)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {module.title} Certification Exam
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {allDone ? 'All lessons complete — pass 75% to earn your badge.' : 'Take the final exam'}
                </div>
              </div>
              <ChevronRight size={18} color="var(--brand-deep)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
