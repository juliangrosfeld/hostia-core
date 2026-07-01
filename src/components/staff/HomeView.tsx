'use client';

import { Play, Lock, Trophy as TrophyIcon, CheckCircle2, Zap, Flame } from 'lucide-react';
import {
  Hand, BookOpen, MessageSquare, Shield, Users, Brain, House, Utensils, UtensilsCrossed, Trophy, Eye, Star,
} from 'lucide-react';
import { PHASE_TOPICS, type Module } from '@/lib/curriculum';
import type { StaffMember } from '@/lib/staff-data';
import type { PropertyProfile } from '@/lib/useUser';
import type { PhaseData, ResolvedModule } from '@/lib/useCurriculum';
import type { HomeProgress } from '@/lib/useHomeProgress';
import { PROPERTY, DEMO_PROPERTY_ID } from '@/lib/config';

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
          <span className="label-mono" style={{ color: 'var(--ink-soft)' }}>Phase {phase.month}</span>
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
  House,
  Utensils,
  UtensilsCrossed,
  Trophy,
  Eye,
  Star,
};

function ModuleCard({
  module, onClick, locked = false,
}: {
  module: Module; onClick: () => void; locked?: boolean;
}) {
  const Icon = ICON_MAP[module.iconName] ?? Hand;
  const isCertification = module.id === 'phase-1-certification';
  // A module is locked either as the (future) certification, or when it's gated
  // behind an earlier, not-yet-complete module in the same phase.
  const isLocked = locked || (isCertification && module.available === false);
  const hasRoleplay = module.lessons.some((l) => Boolean(l.scenarioId));
  // Progress reads from real completion (completedLessons/totalLessons) so the
  // bar reflects actual progress on the real-data path.
  const progressRatio = module.totalLessons > 0 ? module.completedLessons / module.totalLessons : 0;
  // Fully complete (every lesson done) — distinct success treatment. Never for
  // the certification card or a locked/empty module.
  const isComplete = !isLocked && !isCertification && module.totalLessons > 0 && module.completedLessons >= module.totalLessons;
  return (
    <div
      className={`module-card${isComplete ? ' is-complete' : ''}`}
      onClick={isLocked && !isCertification ? undefined : onClick}
      style={{
        ...(isCertification ? { border: '2px solid #B8860B' } : undefined),
        ...(isLocked && !isCertification ? { opacity: 0.55, cursor: 'not-allowed' } : undefined),
      }}
    >
      <div className="module-band" style={{ background: module.color }} />
      <div className="module-card-body">
        <div className="module-card-inner">
          <div className="module-icon-wrap" style={{ background: `${module.color}18` }}>
            <Icon size={22} color={module.color} />
          </div>
          {isLocked ? (
            <Lock size={18} color={isCertification ? '#B8860B' : 'var(--ink-soft)'} strokeWidth={2} />
          ) : (
            isComplete && (
              <span className="module-complete-badge">
                <CheckCircle2 size={13} /> Complete
              </span>
            )
          )}
        </div>
        <div className="module-card-text">
          <h3 className="display module-title">{module.title}</h3>
          <p className="module-sub">{module.subtitle}</p>
        </div>
        {isCertification ? (
          <div style={{ marginBottom: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#B8860B', background: 'rgba(184,134,11,0.12)', borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase' }}>
              🏆 Phase 1 Final Exam
            </span>
          </div>
        ) : hasRoleplay && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: module.color, background: `${module.color}18`, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase' }}>
              ⚡ Live Roleplay
            </span>
          </div>
        )}
        {isCertification ? (
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={12} color="#B8860B" strokeWidth={2} />
            Complete all Phase 1 modules to unlock
          </div>
        ) : (
          <div className="module-progress-row">
            <div className="module-progress-bar">
              <div
                className="module-progress-fill"
                style={{ width: `${progressRatio * 100}%`, background: module.color }}
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
              {module.completedLessons}/{module.totalLessons}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Sum every lesson's `duration` ("7 min") across all modules and format as "~2h 27m".
function formatCurriculumTime(curriculum: Module[]): string {
  const totalMin = curriculum.reduce(
    (sum, m) =>
      sum +
      m.lessons.reduce((s, l) => {
        const n = parseInt(l.duration, 10);
        return s + (Number.isFinite(n) ? n : 0);
      }, 0),
    0,
  );
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours === 0) return `~${minutes}m`;
  if (minutes === 0) return `~${hours}h`;
  return `~${hours}h ${minutes}m`;
}

// ─── Phase-aware curriculum (real, non-demo staff) ───────────
// PhaseData / PhaseGroup / ResolvedModule are defined in useCurriculum (single
// source of truth) and imported above.

function PhaseCurriculum({
  data, onOpenModule,
}: { data: PhaseData; onOpenModule: (m: Module) => void }) {
  const ordered = data.phases; // already ordered by phase_number ASC
  const totalPhases = ordered.length;
  const completed = new Set(data.completedPhaseIds);
  const currentIndex = ordered.findIndex((g) => !completed.has(g.phase.id));

  // All phases complete → celebration state.
  if (currentIndex === -1) {
    return (
      <div style={{ marginTop: 48 }}>
        <div style={{ padding: '40px 32px', borderRadius: 20, textAlign: 'center', background: 'var(--ocean-deep)' }}>
          <TrophyIcon size={40} color="#F5A623" style={{ marginBottom: 16 }} />
          <h2 className="display" style={{ fontSize: 30, color: 'white', margin: '0 0 10px' }}>All phases complete!</h2>
          <p style={{ fontSize: 15, color: 'rgba(250,247,242,0.7)', margin: 0 }}>
            You&apos;ve earned every certification in your track. Outstanding work.
          </p>
        </div>
      </div>
    );
  }

  const current = ordered[currentIndex];
  const future = ordered.slice(currentIndex + 1);
  const past = ordered.slice(0, currentIndex);

  // Phase 1 also surfaces the not-yet-categorized ("universal") modules.
  // Safety net: the API already returns each phase's modules sorted by
  // order_in_phase, but re-sort client-side so render order always follows the
  // Supabase order_in_phase value rather than CURRICULUM array position.
  const isPhaseOne = current.phase.phase_number === 1;
  const currentModules: ResolvedModule[] = (
    isPhaseOne ? [...current.modules, ...data.unassigned] : [...current.modules]
  ).sort((a, b) => (a.order_in_phase ?? 999) - (b.order_in_phase ?? 999));

  const totalMods = currentModules.length;
  const doneMods = currentModules.filter(
    (m) => m.totalLessons > 0 && m.completedLessons >= m.totalLessons,
  ).length;
  const pct = totalMods > 0 ? Math.round((doneMods / totalMods) * 100) : 0;

  return (
    <div style={{ marginTop: 48 }}>
      {/* Completed phases (small certified tiles) */}
      {past.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {past.map((g) => (
            <div key={g.phase.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: 'rgba(129,178,154,0.12)', border: '1px solid rgba(129,178,154,0.4)' }}>
              <CheckCircle2 size={16} color="var(--sage-deep)" />
              <span style={{ fontSize: 13 }}>
                <b>Phase {g.phase.phase_number}</b> · {g.phase.certification_title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Current phase header */}
      <div style={{ padding: '24px 28px', borderRadius: 18, background: 'white', border: '1px solid var(--sand-deeper)', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span
            className="journey-badge"
            style={{ background: 'rgba(245,166,35,0.15)', color: '#8a6000', borderColor: 'rgba(245,166,35,0.4)' }}
          >
            YOU ARE HERE
          </span>
          <span className="label-mono" style={{ color: 'var(--brand)' }}>
            Phase {current.phase.phase_number} of {totalPhases}
          </span>
        </div>
        <h2 className="display" style={{ fontSize: 26, color: 'var(--brand-deep)', margin: '0 0 6px' }}>
          {current.phase.title}
        </h2>
        <div className="journey-level" style={{ marginBottom: 10 }}>→ {current.phase.certification_title}</div>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55, margin: '0 0 18px', maxWidth: 620 }}>
          {current.phase.goal}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--sand-warm)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#F5A623', borderRadius: 999, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
            {doneMods} / {totalMods} modules
          </span>
        </div>
      </div>

      {/* Current phase modules */}
      {currentModules.length > 0 ? (
        <div className="module-grid">
          {currentModules.map((m) => (
            <ModuleCard
              key={m.id}
              module={m}
              locked={m.locked}
              onClick={() => onOpenModule(m)}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, border: '1px dashed var(--sand-deeper)', borderRadius: 14 }}>
          No modules assigned to this phase yet.
        </div>
      )}

      {/* Locked future phases — journey card style */}
      {future.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h3 className="display" style={{ fontSize: 20, color: 'var(--brand-deep)', margin: '0 0 18px' }}>
            Your Journey
          </h3>
          <div className="journey-grid">
            {future.map((g) => {
              const topics = PHASE_TOPICS[g.phase.track]?.[g.phase.phase_number] ?? [];
              return (
              <div key={g.phase.id} className="journey-card" style={{ opacity: 0.5 }}>
                <div className="journey-band" style={{ background: 'var(--ink-soft)' }} />
                <div className="journey-card-body">
                  <div className="journey-card-top">
                    <span
                      className="journey-badge"
                      style={{ background: 'var(--sand-warm)', color: 'var(--ink-soft)' }}
                    >
                      Coming soon
                    </span>
                    <Lock size={15} color="var(--ink-soft)" strokeWidth={2} />
                  </div>

                  <div style={{ marginBottom: 4 }}>
                    <span className="label-mono" style={{ color: 'var(--ink-soft)' }}>Phase {g.phase.phase_number}</span>
                  </div>
                  <h3 className="display journey-title">{g.phase.title}</h3>
                  <div className="journey-level">→ {g.phase.certification_title}</div>
                  <p className="journey-desc">{g.phase.goal}</p>

                  {topics.length > 0 && (
                    <div className="journey-topics">
                      {topics.map((t) => (
                        <span key={t} className="journey-topic-chip">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface HomeViewProps {
  curriculum: Module[];
  phaseData: PhaseData | null;
  progress: HomeProgress | null;
  earnedXp: number;
  streak: number;
  onOpenModule: (m: Module) => void;
  viewingAs: StaffMember | null;
  property?: PropertyProfile | null;
}

export default function HomeView({
  curriculum, phaseData, progress, earnedXp, streak, onOpenModule, viewingAs, property,
}: HomeViewProps) {
  const firstName = viewingAs ? viewingAs.name.split(' ')[0] : 'there';
  const progressPct = viewingAs ? Math.round((viewingAs.lessons / viewingAs.total) * 100) : 50;

  // phaseData, progress and earnedXp/streak arrive as already-resolved props —
  // the staff page fetches them and gates its first paint on that data, so the
  // hero and curriculum render their real state immediately (no fallback flicker).
  //
  // Phase-aware layout applies only to a real, signed-in staff member at a
  // non-demo property. Manager "view as" previews and the Hostia Demo property
  // keep the original mock layout untouched.
  const isDemo = property?.id === DEMO_PROPERTY_ID;
  const phaseEligible = !viewingAs && property != null && !isDemo;

  const usePhaseLayout = phaseEligible && phaseData != null && !phaseData.isDemo && phaseData.phases.length > 0;

  const currentModule = curriculum.find((m) => m.available && m.progress > 0 && m.progress < 1)
    ?? curriculum.find((m) => m.available);
  const currentLesson = currentModule?.lessons.find((l) => l.status === 'current');

  // Real (non-demo) staff get live progress text; everyone else keeps mock copy.
  const useRealBanner = !viewingAs && progress != null && progress.isDemo === false;

  const totalXp = curriculum.reduce((a, m) => a + m.xpTotal, 0);
  const totalLessons = curriculum.reduce((a, m) => a + m.totalLessons, 0);
  const totalTime = formatCurriculumTime(curriculum);

  return (
    <div className="page animate-fade-up">
      <div className="container">

        {/* Hero banner */}
        <div className="hero-banner">
          <div className="hero-content">
            {/* Property logo intentionally not rendered for now (still saved in
                the DB via the admin upload — just hidden in the UI). */}
            <div className="hero-eyebrow">Welcome back, {firstName}</div>
            <h1 className="display hero-title">
              Make every table remember this place.
            </h1>
            <p className="hero-sub">
              {useRealBanner ? (
                progress!.started ? (
                  <>
                    You're <b style={{ color: 'white' }}>{progress!.percent}%</b> through{' '}
                    {progress!.moduleTitle ?? 'your first module'}. Keep your streak alive.
                  </>
                ) : (
                  <>
                    Ready to start your training? Begin with{' '}
                    {progress!.firstModuleTitle ?? progress!.moduleTitle ?? 'your first module'}.
                  </>
                )
              ) : (
                <>
                  You're <b style={{ color: 'white' }}>{progressPct}%</b> through{' '}
                  {currentModule?.title ?? 'your first module'}. Keep your streak alive.
                </>
              )}
            </p>
            {/* Continue button, bottom-anchored in the left column. */}
            <div style={{ marginTop: 'auto' }}>
              {currentModule && (
                <button className="btn-brand" onClick={() => onOpenModule(currentModule)}>
                  <Play size={14} />
                  {currentLesson ? `Continue: ${currentLesson.title}` : `Start: ${currentModule.title}`}
                </button>
              )}
            </div>
          </div>
          <div className="hero-deco" aria-hidden="true">
            <div className="deco-circle deco-circle-1" />
            <div className="deco-circle deco-circle-2" />
            <div className="deco-circle deco-circle-3" />
          </div>
          {/* XP + streak stat callouts: right side of the banner, vertically
              centered, in the open space beside the heading/text. */}
          <div className="hero-stats">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Zap size={40} color="var(--brand)" fill="var(--brand)" />
                <span style={{ fontSize: 54, fontWeight: 800, lineHeight: 1, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                  {earnedXp.toLocaleString()}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                XP
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Flame size={40} color="#F5A623" />
                <span style={{ fontSize: 54, fontWeight: 800, lineHeight: 1, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                  {streak}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                Day Streak
              </span>
            </div>
          </div>
        </div>

        {/* Gold standard quote — brand-colored background, matching the hero */}
        <div style={{ margin: '32px 0', padding: '20px 28px', background: 'linear-gradient(135deg, var(--brand-color, #1B2B4B) 0%, color-mix(in srgb, var(--brand-color, #1B2B4B) 62%, #000) 100%)', borderRadius: 16 }}>
          <div className="label-mono" style={{ color: 'var(--brand)', marginBottom: 8 }}>
            {PROPERTY.name} standard
          </div>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: 17, color: 'rgba(250,247,242,0.9)', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
            &ldquo;{PROPERTY.goldStandard}&rdquo;
          </p>
        </div>

        {usePhaseLayout ? (
          /* Phase-aware curriculum — current phase + locked future phases */
          <PhaseCurriculum data={phaseData!} onOpenModule={onOpenModule} />
        ) : (
          <>
            {/* Curriculum header */}
            <div className="curriculum-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, marginTop: 48 }}>
              <h2 className="display" style={{ fontSize: 28, color: 'var(--brand-deep)' }}>Curriculum</h2>
              <span className="curriculum-sub" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                {curriculum.length} modules · {totalLessons} lessons · {totalTime} total
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

        {/* Journey */}
        <div style={{ marginTop: 64 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 className="display" style={{ fontSize: 28, color: 'var(--brand-deep)', margin: '0 0 8px' }}>
              Your Journey
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
              After Phase 6 — Continuous Development
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
          </>
        )}

      </div>
    </div>
  );
}
