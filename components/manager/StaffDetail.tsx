'use client';

import { ChevronLeft, Flame, Trophy, Eye, MessageSquare, Target, Check, Lock } from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import type { StaffMember } from '@/lib/staff-data';
import { SKILL_LABELS } from '@/lib/staff-data';

function StaffStat({ label, value, color, small }: { label: string; value: string | number; color?: string; small?: boolean }) {
  return (
    <div>
      <div className="label-mono">{label}</div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: small ? 16 : 26, fontWeight: 500, color: color || 'var(--brand-deep)', marginTop: 4, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<StaffMember['status'], string> = {
  star: '⭐ Star performer',
  active: 'Active',
  developing: 'Developing',
  'at-risk': 'At risk',
  new: 'New hire',
};

interface StaffDetailProps {
  staff: StaffMember;
  onBack: () => void;
  onViewAs: (s: StaffMember) => void;
}

export default function StaffDetail({ staff: s, onBack, onViewAs }: StaffDetailProps) {
  const skillData = (Object.keys(SKILL_LABELS) as (keyof typeof SKILL_LABELS)[]).map((k) => ({
    skill: SKILL_LABELS[k],
    value: s.skills[k],
    fullMark: 100,
  }));

  // Map lessons to modules
  const modules = [
    { name: 'Greetings & First Impressions', done: Math.min(s.lessons, 4), total: 4, avg: s.skills.greetings },
    { name: 'The Service Flow', done: Math.max(0, Math.min(5, s.lessons - 4)), total: 5, avg: s.skills.serviceFlow },
    { name: 'Language & Storytelling', done: Math.max(0, Math.min(4, s.lessons - 9)), total: 4, avg: s.skills.language },
    { name: 'Handling Complaints & Errors', done: Math.max(0, Math.min(5, s.lessons - 13)), total: 5, avg: s.skills.complaints },
    { name: 'Floor Choreography', done: Math.max(0, Math.min(4, s.lessons - 18)), total: 4, avg: s.skills.floor },
    { name: 'Guest Psychology', done: Math.max(0, Math.min(4, s.lessons - 22)), total: 4, avg: s.skills.guestPsychology },
  ];

  const recentRoleplays = [
    { scenario: 'Multilingual Welcome — Dutch couple', score: s.skills.greetings, when: '2h ago' },
    { scenario: 'Proactive Drinks Suggestion — group of 5', score: s.skills.serviceFlow, when: '1d ago' },
    { scenario: 'Overcooked Burger — Mr. Hans', score: s.skills.complaints, when: '3d ago' },
  ].filter((r) => r.score > 0);

  const scoreColor = s.score >= 80 ? 'var(--sage-deep)' : s.score >= 60 ? 'var(--gold-deep)' : 'var(--coral-deep)';

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
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <span className={`status-pill status-${s.status}`}>{STATUS_LABEL[s.status]}</span>
                <span className="chip"><Flame size={11} color="var(--brand)" /> {s.streak}-day streak</span>
                <span className="chip"><Trophy size={11} color="#D4A574" /> {s.badges} badges</span>
              </div>
            </div>
            <div className="staff-hero-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <button className="btn-brand-sm" onClick={() => onViewAs(s)}>
                <Eye size={13} /> View as {s.name.split(' ')[0]}
              </button>
              <button className="btn-ghost-sm"><MessageSquare size={13} /> Send message</button>
              <button className="btn-ghost-sm"><Target size={13} /> Assign module</button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="staff-stats">
            <StaffStat label="Overall score" value={`${s.score}%`} color={scoreColor} />
            <div className="div-vert" />
            <StaffStat label="Lessons" value={`${s.lessons}/${s.total}`} />
            <div className="div-vert" />
            <StaffStat label="Level" value={`L${s.level}`} />
            <div className="div-vert" />
            <StaffStat label="XP earned" value={s.xp} color="var(--brand)" />
            <div className="div-vert" />
            <StaffStat label="Last active" value={s.lastActive} small />
          </div>
        </div>

        {/* ─ Skills + Progress grid ─ */}
        <div className="detail-grid">
          {/* Radar chart */}
          <div className="card" style={{ padding: 28 }}>
            <div className="label-mono">Skill profile</div>
            <h3 className="display" style={{ fontSize: 20, color: 'var(--brand-deep)', margin: '6px 0 0' }}>
              Strengths & gaps
            </h3>
            <div style={{ height: 280, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="#E5DCC9" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#4A5568' }} />
                  <Radar dataKey="value" stroke="#F5A623" fill="#F5A623" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Module progress */}
          <div className="card" style={{ padding: 28 }}>
            <div className="label-mono">Module progress</div>
            <h3 className="display" style={{ fontSize: 20, color: 'var(--brand-deep)', margin: '6px 0 18px' }}>
              Where they stand
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {modules.map((m, i) => {
                const pct = (m.done / m.total) * 100;
                const isDone = m.done === m.total;
                const notStarted = m.done === 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ fontWeight: isDone ? 700 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {isDone && <Check size={12} color="var(--sage)" />}
                        {notStarted && <Lock size={11} color="var(--ink-soft)" />}
                        {m.name}
                      </span>
                      <span style={{ color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>
                        {m.done}/{m.total}{m.avg > 0 ? ` · ${m.avg}%` : ''}
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
        </div>

        {/* ─ Recent roleplay scores ─ */}
        {recentRoleplays.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 className="display" style={{ fontSize: 22, marginBottom: 16, color: 'var(--brand-deep)' }}>
              Recent roleplay scores
            </h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {recentRoleplays.map((r, i) => {
                const rScoreColor = r.score >= 80 ? 'var(--sage-deep)' : r.score >= 60 ? 'var(--gold-deep)' : 'var(--coral-deep)';
                return (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: i === recentRoleplays.length - 1 ? 'none' : '1px solid var(--sand-deeper)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(17,17,17,0.06)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{r.scenario}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{r.when}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, color: rScoreColor }}>
                        {r.score}%
                      </div>
                      <button className="btn-ghost-sm">
                        View transcript <ChevronLeft size={12} style={{ transform: 'rotate(180deg)' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─ Manager notes ─ */}
        <div style={{ marginTop: 32 }}>
          <h2 className="display" style={{ fontSize: 22, marginBottom: 16, color: 'var(--brand-deep)' }}>
            Manager notes
          </h2>
          <div className="card" style={{ padding: 20 }}>
            <textarea
              className="notes-area"
              placeholder={`Add a note about ${s.name.split(' ')[0]}… e.g. "Strong with local guests, work on the banned-phrases rule."`}
              rows={3}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn-brand-sm">Save note</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
