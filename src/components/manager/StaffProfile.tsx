'use client';

// ─────────────────────────────────────────────────────────────
// StaffProfile — manager drill-down for one staff member.
//
// Three sections:
//   A. Module Progress   — lessons completed / total, no %.
//   B. Skill Profile     — warmth % per module (getModuleSkillScore).
//   C. Recent Roleplay   — last 3 sessions + transcript modal.
//
// Sections B and C run on MOCK data shaped exactly like the
// `roleplay_sessions` table (warmth_score, passed, transcript: [{ role,
// content, warmth? }], …) so wiring up live data later is a straight swap.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { ChevronLeft, Check, Lock, MessageSquare, Eye, X } from 'lucide-react';
import type { StaffMember } from '@/lib/staff-data';
import { getModuleSkillScore, getWarmthLabel } from '@/lib/xp';

// ─── Schema-shaped types (match roleplay_sessions) ───────────

interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  warmth?: number;
}

interface RoleplaySession {
  scenario: string;
  variant: string | null;
  warmth_score: number;
  passed: boolean;
  completed_at: string; // display string for now; TIMESTAMPTZ live
  turns: number;
  transcript: TranscriptEntry[];
}

// ─── Module definitions (roleplay modules only) ──────────────
// Keys map to StaffMember.skills so mock data varies per staff member.

const MODULES = [
  { key: 'greetings', name: 'Greetings', total: 4 },
  { key: 'floor', name: 'Physical Craft', total: 5 },
  { key: 'serviceFlow', name: 'Service Flow', total: 3 },
  { key: 'language', name: 'Language', total: 4 },
  { key: 'complaints', name: 'Complaints', total: 4 },
  { key: 'guestPsychology', name: 'Guest Psychology', total: 5 },
] as const;

// Build mock sessions whose warmth scores cluster around `score`, so
// getModuleSkillScore() returns a realistic per-module average.
function mockSessionsFor(score: number): { warmth_score: number; passed: boolean }[] {
  if (score <= 0) return [];
  const offsets = [-4, 3, -1, 5];
  return offsets.map((o) => {
    const w = Math.max(0, Math.min(100, score + o));
    return { warmth_score: w, passed: w >= 55 };
  });
}

// ─── Mock recent sessions (last 3) ───────────────────────────

function buildRecentSessions(s: StaffMember): RoleplaySession[] {
  const g = s.skills.greetings;
  const sf = s.skills.serviceFlow;
  const c = s.skills.complaints;

  const all: RoleplaySession[] = [
    {
      scenario: 'Multilingual Welcome',
      variant: 'Dutch couple',
      warmth_score: g,
      passed: g >= 55,
      completed_at: '2h ago',
      turns: 4,
      transcript: [
        { role: 'assistant', content: 'A Dutch couple steps in, glancing around for someone to greet them.', warmth: g - 5 },
        { role: 'user', content: 'Welkom bij [Property]! Fijn dat u er bent — tafel voor twee?' },
        { role: 'assistant', content: 'Oh, lovely — Dutch! Yes, a table for two please.', warmth: g },
        { role: 'user', content: 'Right this way, I have a quiet table by the window for you.' },
        { role: 'assistant', content: 'That sounds perfect, thank you so much.', warmth: g + 2 },
      ],
    },
    {
      scenario: 'Proactive vs Reactive Service',
      variant: 'Group of 5',
      warmth_score: sf,
      passed: sf >= 55,
      completed_at: '1d ago',
      turns: 5,
      transcript: [
        { role: 'assistant', content: 'A table of five is halfway through their mains; two water glasses are nearly empty.', warmth: sf - 6 },
        { role: 'user', content: 'I noticed a couple of glasses running low — let me top those up for you now.' },
        { role: 'assistant', content: 'Oh, thanks — we were about to ask.', warmth: sf },
        { role: 'user', content: 'Of course. Can I tell you about tonight\'s dessert while you finish up?' },
        { role: 'assistant', content: 'Yes please, that would be great.', warmth: sf + 3 },
      ],
    },
    {
      scenario: 'The LEARN Protocol',
      variant: 'Overcooked steak',
      warmth_score: c,
      passed: c >= 55,
      completed_at: '3d ago',
      turns: 4,
      transcript: [
        { role: 'assistant', content: 'A guest waves you over: "This steak is well done — I asked for medium-rare."', warmth: Math.max(0, c - 10) },
        { role: 'user', content: 'You\'re absolutely right, and I\'m sorry — that\'s not what you ordered. Let me get it replaced right away.' },
        { role: 'assistant', content: 'Thank you, I appreciate that.', warmth: c },
        { role: 'user', content: 'Can I bring you something to enjoy while you wait? It\'ll be about eight minutes.' },
        { role: 'assistant', content: 'That would be lovely, thank you.', warmth: c + 4 },
      ],
    },
  ];

  return all.filter((r) => r.warmth_score > 0).slice(0, 3);
}

// ─── Transcript modal ────────────────────────────────────────

function TranscriptModal({ session, onClose }: { session: RoleplaySession; onClose: () => void }) {
  const label = getWarmthLabel(session.warmth_score);
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(17,17,17,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--sand)', borderRadius: 20, width: '100%', maxWidth: 540,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 28px 16px', borderBottom: '1px solid var(--sand-deeper)' }}>
          <div>
            <div className="label-mono">Transcript</div>
            <h3 className="display" style={{ fontSize: 21, color: 'var(--brand-deep)', margin: '4px 0 0' }}>
              {session.scenario}
            </h3>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
              {session.variant ? `${session.variant} · ` : ''}{session.turns} turns · {session.completed_at}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: label.color, whiteSpace: 'nowrap' }}>
              {session.warmth_score}% · {label.label}
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', padding: 4, display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Chat-style transcript: user on the right, guest/assistant on the left */}
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {session.transcript.map((entry, i) => {
            const isStaff = entry.role === 'user';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isStaff ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '78%',
                    padding: '10px 14px',
                    borderRadius: 14,
                    fontSize: 13.5, lineHeight: 1.5,
                    background: isStaff ? 'var(--brand)' : 'white',
                    color: isStaff ? 'var(--brand-deep)' : 'var(--ink)',
                    border: isStaff ? 'none' : '1px solid var(--sand-deeper)',
                    borderBottomRightRadius: isStaff ? 4 : 14,
                    borderBottomLeftRadius: isStaff ? 14 : 4,
                  }}
                >
                  <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, opacity: 0.6, marginBottom: 3 }}>
                    {isStaff ? 'Server' : 'Guest'}
                  </div>
                  {entry.content}
                  {!isStaff && entry.warmth != null && (
                    <span style={{ display: 'block', marginTop: 5, fontSize: 11, color: getWarmthLabel(entry.warmth * 10).color, fontWeight: 700 }}>
                      Warmth {entry.warmth}/10
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────

interface StaffProfileProps {
  staff: StaffMember;
  onBack: () => void;
  onViewAs?: (s: StaffMember) => void;
}

export default function StaffProfile({ staff: s, onBack, onViewAs }: StaffProfileProps) {
  const [openSession, setOpenSession] = useState<RoleplaySession | null>(null);

  // Section A — distribute lessons across modules sequentially.
  const moduleProgress = MODULES.map((m, i) => {
    const priorTotal = MODULES.slice(0, i).reduce((sum, mm) => sum + mm.total, 0);
    const done = Math.max(0, Math.min(m.total, s.lessons - priorTotal));
    return { ...m, done };
  });

  // Section B — warmth % per module via getModuleSkillScore on mock sessions.
  const skillProfile = MODULES.map((m) => ({
    name: m.name,
    score: getModuleSkillScore(mockSessionsFor(s.skills[m.key])),
  }));

  // Section C — last 3 roleplay sessions (mock).
  const recentSessions = buildRecentSessions(s);

  return (
    <div className="mgr-page animate-fade-up">
      <div className="container">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={16} /> Team roster
        </button>

        {/* ─ Hero ─ */}
        <div className="staff-hero">
          <div className="staff-hero-inner" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div className="hero-avatar" style={{ background: s.color }}>{s.initials}</div>
            <div style={{ flex: 1 }}>
              <h1 className="display" style={{ fontSize: 36, color: 'var(--brand-deep)', margin: 0, lineHeight: 1.1 }}>
                {s.name}
              </h1>
              <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
                {s.role} · {s.dept} · Joined {s.joined}
              </div>
            </div>
            {onViewAs && (
              <button className="btn-brand-sm" onClick={() => onViewAs(s)} style={{ flexShrink: 0 }}>
                <Eye size={13} /> View as {s.name.split(' ')[0]}
              </button>
            )}
          </div>
        </div>

        {/* ─ Section A + B grid ─ */}
        <div className="detail-grid">
          {/* Section A — Module progress */}
          <div className="card" style={{ padding: 28 }}>
            <div className="label-mono">Section A · Module progress</div>
            <h3 className="display" style={{ fontSize: 20, color: 'var(--brand-deep)', margin: '6px 0 18px' }}>
              Where they stand
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {moduleProgress.map((m) => {
                const pct = (m.done / m.total) * 100;
                const isDone = m.done === m.total;
                const notStarted = m.done === 0;
                return (
                  <div key={m.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ fontWeight: isDone ? 700 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {notStarted && <Lock size={11} color="var(--ink-soft)" />}
                        {m.name}
                      </span>
                      <span style={{ color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {m.done}/{m.total}
                        {isDone && <Check size={13} color="var(--sage)" />}
                      </span>
                    </div>
                    <div className="skill-bar-track" style={{ height: 4 }}>
                      <div
                        className="skill-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: isDone ? 'var(--sage)' : notStarted ? 'var(--sand-deeper)' : s.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B — Skill profile (warmth % per module) */}
          <div className="card" style={{ padding: 28 }}>
            <div className="label-mono">Section B · Skill profile</div>
            <h3 className="display" style={{ fontSize: 20, color: 'var(--brand-deep)', margin: '6px 0 6px' }}>
              Warmth by module
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '0 0 18px' }}>
              Average warmth score across passed roleplays. Below 70% needs work.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {skillProfile.map((m) => {
                const color = getWarmthLabel(m.score).color;
                return (
                  <div key={m.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span>{m.name}</span>
                      <span style={{ color, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {m.score > 0 ? `${m.score}%` : '—'}
                      </span>
                    </div>
                    <div className="skill-bar-track" style={{ height: 6 }}>
                      <div className="skill-bar-fill" style={{ width: `${m.score}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─ Section C — Recent roleplay scores ─ */}
        <div style={{ marginTop: 32 }}>
          <div className="label-mono">Section C · Recent roleplay scores</div>
          <h2 className="display" style={{ fontSize: 22, margin: '6px 0 16px', color: 'var(--brand-deep)' }}>
            Last {recentSessions.length} sessions
          </h2>

          {recentSessions.length === 0 ? (
            <div className="card" style={{ padding: 24, fontSize: 14, color: 'var(--ink-soft)' }}>
              No roleplay sessions yet.
            </div>
          ) : (
            <>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {recentSessions.map((r, i) => {
                  const label = getWarmthLabel(r.warmth_score);
                  return (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: i === recentSessions.length - 1 ? 'none' : '1px solid var(--sand-deeper)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(17,17,17,0.06)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MessageSquare size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>
                            {r.scenario}
                            {r.variant && <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}> · {r.variant}</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                            {r.completed_at} · {r.passed ? 'Passed' : 'Not passed'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
                        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, color: label.color }}>
                          {r.warmth_score}%
                        </div>
                        <button className="btn-ghost-sm" onClick={() => setOpenSession(r)}>
                          View transcript
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View all */}
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button
                  className="btn-ghost-sm"
                  onClick={() => { /* TODO: full roleplay history (live data) */ }}
                >
                  View all sessions
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transcript modal */}
      {openSession && (
        <TranscriptModal session={openSession} onClose={() => setOpenSession(null)} />
      )}
    </div>
  );
}
