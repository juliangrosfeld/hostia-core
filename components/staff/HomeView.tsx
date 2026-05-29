'use client';

import { Play } from 'lucide-react';
import {
  Hand, ArrowRight, MessageSquare, Shield, Users,
} from 'lucide-react';
import type { Module } from '@/lib/curriculum';
import type { StaffMember } from '@/lib/staff-data';
import { PROPERTY } from '@/lib/config';

// Icon map
const ICON_MAP: Record<string, React.ElementType> = {
  Hand,
  ArrowRight,
  MessageSquare,
  Shield,
  Users,
  Brain: MessageSquare,
};

function ModuleCard({ module, onClick }: { module: Module; onClick: () => void }) {
  const Icon = ICON_MAP[module.iconName] ?? Hand;
  return (
    <div
      className="module-card"
      onClick={onClick}
    >
      <div className="module-band" style={{ background: module.color }} />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${module.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={22} color={module.color} />
          </div>
          {module.completedLessons === module.totalLessons && (
            <span className="module-certified-badge">
              ✓ Complete
            </span>
          )}
        </div>
        <h3 className="display module-title">{module.title}</h3>
        <p className="module-sub">{module.subtitle}</p>
        <div className="module-progress-row">
          <div className="module-progress-bar">
            <div
              className="module-progress-fill"
              style={{ width: `${module.progress * 100}%`, background: module.color }}
            />
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
            {module.completedLessons}/{module.totalLessons}
          </span>
        </div>
      </div>
    </div>
  );
}

interface HomeViewProps {
  curriculum: Module[];
  onOpenModule: (m: Module) => void;
  viewingAs: StaffMember | null;
}

export default function HomeView({ curriculum, onOpenModule, viewingAs }: HomeViewProps) {
  const firstName = viewingAs ? viewingAs.name.split(' ')[0] : 'there';
  const progressPct = viewingAs ? Math.round((viewingAs.lessons / viewingAs.total) * 100) : 50;

  const currentModule = curriculum.find((m) => m.available && m.progress > 0 && m.progress < 1)
    ?? curriculum.find((m) => m.available);
  const currentLesson = currentModule?.lessons.find((l) => l.status === 'current');

  const totalXp = curriculum.reduce((a, m) => a + m.xpTotal, 0);
  const totalLessons = curriculum.reduce((a, m) => a + m.totalLessons, 0);

  return (
    <div className="page animate-fade-up">
      <div className="container">

        {/* Hero banner */}
        <div className="hero-banner">
          <div className="hero-content">
            <img
              src="/Brgrlogo.png"
              alt="Brgr Haus"
              style={{ height: 32, width: 32, borderRadius: 6, objectFit: 'cover', marginBottom: 16 }}
            />
            <div className="hero-eyebrow">Welcome back, {firstName}</div>
            <h1 className="display hero-title">
              Make every table remember this place.
            </h1>
            <p className="hero-sub">
              You're <b style={{ color: 'white' }}>{progressPct}%</b> through{' '}
              {currentModule?.title ?? 'your first module'}. Keep your streak alive.
            </p>
            {currentModule && (
              <button className="btn-brand" onClick={() => onOpenModule(currentModule)}>
                <Play size={14} />
                {currentLesson ? `Continue: ${currentLesson.title}` : `Start: ${currentModule.title}`}
              </button>
            )}
          </div>
          <div className="hero-deco" aria-hidden="true">
            <div className="deco-circle deco-circle-1" />
            <div className="deco-circle deco-circle-2" />
            <div className="deco-circle deco-circle-3" />
          </div>
        </div>

        {/* Gold standard quote */}
        <div style={{ margin: '32px 0', padding: '20px 28px', background: 'var(--brand-deep)', borderRadius: 16 }}>
          <div className="label-mono" style={{ color: 'var(--brand)', marginBottom: 8 }}>
            {PROPERTY.name} standard
          </div>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: 17, color: 'rgba(250,247,242,0.9)', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
            &ldquo;{PROPERTY.goldStandard}&rdquo;
          </p>
        </div>

        {/* Curriculum header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, marginTop: 48 }}>
          <h2 className="display" style={{ fontSize: 28, color: 'var(--brand-deep)' }}>Curriculum</h2>
          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            {curriculum.length} modules · {totalLessons} lessons · ~4 hours total
          </span>
        </div>

        <div className="module-grid">
          {curriculum.map((m) => (
            <ModuleCard
              key={m.id}
              module={m}
              onClick={() => onOpenModule(m)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
