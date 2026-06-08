'use client';

import { Play, Lock } from 'lucide-react';
import {
  Hand, BookOpen, MessageSquare, Shield, Users, Brain,
} from 'lucide-react';
import type { Module } from '@/lib/curriculum';
import type { StaffMember } from '@/lib/staff-data';
import { PROPERTY } from '@/lib/config';

// ─── 6-Month Journey data ────────────────────────────────────

interface JourneyPhase {
  month: number;
  badge: string;
  title: string;
  level: string;
  description: string;
  topics: string[];
  locked: boolean;
  color: string;
}

const JOURNEY_PHASES: JourneyPhase[] = [
  {
    month: 1,
    badge: 'YOU ARE HERE',
    title: 'Foundation',
    level: 'Certified Team Member',
    description: 'Master the service standards, physical craft, language, and guest psychology that define great hospitality.',
    topics: ['Greetings', 'Physical Craft', 'Service Flow', 'Language & Storytelling', 'Complaints', 'Guest Psychology'],
    locked: false,
    color: '#F5A623',
  },
  {
    month: 2,
    badge: 'COMING SOON',
    title: 'Consistency',
    level: 'Reliable Team Member',
    description: 'Perform at your best even under pressure — busy shifts, multitasking, service recovery in real time.',
    topics: ['Busy shift scenarios', 'Multitasking', 'Service recovery practice', 'Communication under pressure', 'Time management'],
    locked: true,
    color: '#81B29A',
  },
  {
    month: 3,
    badge: 'COMING SOON',
    title: 'Guest Mastery',
    level: 'Guest Experience Specialist',
    description: 'Adapt your service to every type of guest — families, couples, VIPs, demanding guests, and everyone in between.',
    topics: ['Families', 'Couples', 'VIP guests', 'Returning guests', 'Business guests', 'Demanding guests'],
    locked: true,
    color: '#8DA9C4',
  },
  {
    month: 4,
    badge: 'COMING SOON',
    title: 'Revenue Excellence',
    level: 'Hospitality Professional',
    description: 'Learn to increase guest satisfaction while driving revenue — upselling, product knowledge, and recommendation techniques.',
    topics: ['Suggestive selling', 'Product knowledge mastery', 'Recommendation techniques', 'Reading buying signals'],
    locked: true,
    color: '#D4A574',
  },
  {
    month: 5,
    badge: 'COMING SOON',
    title: 'Culture & Tourism Excellence',
    level: 'Tourism Ambassador',
    description: 'Become an ambassador for both the property and the destination — serving international guests with cultural intelligence.',
    topics: ['Dutch visitors', 'American visitors', 'Local guests', 'Cruise tourists', 'Cultural expectations', 'Tourism-focused recommendations'],
    locked: true,
    color: '#E07A5F',
  },
  {
    month: 6,
    badge: 'COMING SOON',
    title: 'Leadership & Difficult Situations',
    level: 'Senior Hospitality Professional',
    description: 'Step into a leadership role — handle major service failures, train new team members, and resolve conflict.',
    topics: ['Leadership mindset', 'Taking initiative', 'Training new staff', 'Handling difficult situations', 'Conflict resolution'],
    locked: true,
    color: '#111111',
  },
];

function JourneyCard({ phase }: { phase: JourneyPhase }) {
  return (
    <div
      className="journey-card"
      style={{ opacity: phase.locked ? 0.5 : 1 }}
    >
      <div className="journey-band" style={{ background: phase.color }} />
      <div className="journey-card-body">
        <div className="journey-card-top">
          <span
            className="journey-badge"
            style={
              phase.locked
                ? { background: 'var(--sand-warm)', color: 'var(--ink-soft)' }
                : { background: 'rgba(245,166,35,0.15)', color: '#8a6000', borderColor: 'rgba(245,166,35,0.4)' }
            }
          >
            {phase.badge}
          </span>
          {phase.locked && (
            <Lock size={15} color="var(--ink-soft)" strokeWidth={2} />
          )}
        </div>

        <div style={{ marginBottom: 4 }}>
          <span className="label-mono" style={{ color: 'var(--ink-soft)' }}>Month {phase.month}</span>
        </div>
        <h3 className="display journey-title">{phase.title}</h3>
        <div className="journey-level">→ {phase.level}</div>
        <p className="journey-desc">{phase.description}</p>

        <div className="journey-topics">
          {phase.topics.map((t) => (
            <span key={t} className="journey-topic-chip">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Icon map
const ICON_MAP: Record<string, React.ElementType> = {
  Hand,
  BookOpen,
  MessageSquare,
  Shield,
  Users,
  Brain,
};

function ModuleCard({ module, onClick }: { module: Module; onClick: () => void }) {
  const Icon = ICON_MAP[module.iconName] ?? Hand;
  return (
    <div className="module-card" onClick={onClick}>
      <div className="module-band" style={{ background: module.color }} />
      <div className="module-card-body">
        <div className="module-card-inner">
          <div className="module-icon-wrap" style={{ background: `${module.color}18` }}>
            <Icon size={22} color={module.color} />
          </div>
          {module.completedLessons === module.totalLessons && (
            <span className="module-certified-badge">✓ Complete</span>
          )}
        </div>
        <div className="module-card-text">
          <h3 className="display module-title">{module.title}</h3>
          <p className="module-sub">{module.subtitle}</p>
        </div>
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
              src="/hostia-logo.png"
              alt="Hostia"
              style={{ height: 32, width: 'auto', objectFit: 'contain', marginBottom: 16 }}
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
        <div className="curriculum-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, marginTop: 48 }}>
          <h2 className="display" style={{ fontSize: 28, color: 'var(--brand-deep)' }}>Curriculum</h2>
          <span className="curriculum-sub" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
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

        {/* 6-Month Journey */}
        <div style={{ marginTop: 64 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 className="display" style={{ fontSize: 28, color: 'var(--brand-deep)', margin: '0 0 8px' }}>
              Your 6-Month Journey
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.55 }}>
              From new hire to Senior Hospitality Professional — your complete development path.
            </p>
          </div>

          <div className="journey-grid">
            {JOURNEY_PHASES.map((phase) => (
              <JourneyCard key={phase.month} phase={phase} />
            ))}
          </div>

          {/* Continuous Development banner */}
          <div className="journey-cta-banner">
            <div className="label-mono" style={{ color: 'rgba(141,169,196,0.8)', marginBottom: 10 }}>
              What comes after
            </div>
            <h3 className="display" style={{ fontSize: 22, color: 'white', margin: '0 0 10px', lineHeight: 1.2 }}>
              After Month 6 — Continuous Development
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(250,247,242,0.65)', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 560 }}>
              Monthly challenge packs, quarterly certifications, and AI-assigned training keep your skills sharp and your career growing.
            </p>
            <div className="journey-cta-pills">
              <span className="journey-cta-pill">🏆 Quarterly Certifications</span>
              <span className="journey-cta-pill">⚡ Monthly Challenges</span>
              <span className="journey-cta-pill">🎯 AI-Personalized Training</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
