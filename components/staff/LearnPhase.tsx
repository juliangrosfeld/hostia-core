'use client';

import { useState } from 'react';
import { ChevronRight, Lightbulb } from 'lucide-react';
import type { Lesson, LearnSection, LangCard, PhraseRow } from '@/lib/curriculum';

// ─── Section renderers ────────────────────────────────────────

function SectionIntro({ text }: { text: string }) {
  return (
    <div className="card" style={{ padding: 32, marginBottom: 24 }}>
      <div className="label-mono" style={{ color: 'var(--brand)' }}>Why this matters</div>
      <p style={{ fontSize: 16.5, lineHeight: 1.65, color: 'var(--ink)', marginTop: 12, marginBottom: 0 }}>
        {text}
      </p>
    </div>
  );
}

function SectionCallout({ tone, label, text }: { tone: 'tip' | 'warn' | 'rule'; label: string; text: string }) {
  const colors: Record<string, { bg: string; border: string; label: string }> = {
    rule: { bg: 'rgba(245,166,35,0.08)', border: 'var(--brand)', label: '#8a6000' },
    warn: { bg: 'rgba(224,122,95,0.08)', border: 'var(--coral)', label: 'var(--coral-deep)' },
    tip: { bg: 'rgba(129,178,154,0.1)', border: 'var(--sage)', label: 'var(--sage-deep)' },
  };
  const c = colors[tone];
  return (
    <div style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, borderRadius: '4px 12px 12px 4px', padding: '16px 20px', marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.label, marginBottom: 6 }}>
        {label}
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink)', margin: 0 }}>{text}</p>
    </div>
  );
}

function SectionPrinciples({ items }: { items: { num: number; title: string; body: string }[] }) {
  return (
    <div className="principles-grid" style={{ marginBottom: 24 }}>
      {items.map((item) => (
        <div key={item.num} className="principle-card">
          <div className="principle-number">{item.num}</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--brand-deep)', marginBottom: 6 }}>
            {item.title}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{item.body}</div>
        </div>
      ))}
    </div>
  );
}

function SectionSteps({ title, items }: { title: string; items: { num: number; title: string; body: string; badge?: string }[] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 className="display" style={{ fontSize: 20, color: 'var(--brand-deep)', marginBottom: 16 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => (
          <div
            key={item.num}
            style={{ display: 'flex', gap: 16, background: 'white', border: '1px solid var(--sand-deeper)', borderRadius: 14, padding: '16px 20px' }}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 600, flexShrink: 0 }}>
              {item.num}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--brand-deep)' }}>{item.title}</span>
                {item.badge && (
                  <span style={{ background: 'rgba(245,166,35,0.15)', color: '#8a6000', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 999, textTransform: 'uppercase' }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{item.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionLangGrid({ items }: { items: LangCard[] }) {
  const [tone, setTone] = useState<'formal' | 'casual'>('casual');
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="display" style={{ fontSize: 22, color: 'var(--brand-deep)', margin: 0 }}>
          The four languages of Curaçao
        </h3>
        <div className="tone-toggle">
          <button className={tone === 'formal' ? 'is-active' : ''} onClick={() => setTone('formal')}>Formal</button>
          <button className={tone === 'casual' ? 'is-active' : ''} onClick={() => setTone('casual')}>Casual</button>
        </div>
      </div>
      <div className="lang-grid">
        {items.map((g) => (
          <div key={g.lang} className="lang-card">
            <div className="lang-header">
              <span className="lang-flag">{g.flag}</span>
              <span className="display lang-name">{g.lang}</span>
            </div>
            <div className="lang-phrase">"{tone === 'formal' ? g.formal : g.casual}"</div>
            <div className="lang-tip">
              <Lightbulb size={12} style={{ flexShrink: 0, marginTop: 2, color: 'var(--gold)' }} />
              {g.tip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionPhraseTable({ rows }: { rows: PhraseRow[] }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 className="display" style={{ fontSize: 22, color: 'var(--brand-deep)', marginBottom: 16 }}>
        Key phrases — quick reference
      </h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="phrase-table-head">
          <div>English</div><div>Dutch</div><div>Spanish</div><div>Papiamentu</div>
        </div>
        {rows.map((p, i) => (
          <div key={i} className="phrase-row">
            <div style={{ color: 'var(--ink-soft)' }}>{p.en}</div>
            <div>{p.nl}</div>
            <div>{p.es}</div>
            <div style={{ color: 'var(--brand)', fontWeight: 600 }}>{p.pap}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionDoDont({ title, items }: { title: string; items: { do: string; dont: string }[] }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 className="display" style={{ fontSize: 22, color: 'var(--brand-deep)', marginBottom: 16 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} className="do-dont-grid">
            <div className="do-card">
              <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', color: 'var(--sage-deep)', textTransform: 'uppercase', marginBottom: 8 }}>✓ Do this</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink)' }}>{item.do}</div>
            </div>
            <div className="dont-card">
              <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', color: 'var(--coral-deep)', textTransform: 'uppercase', marginBottom: 8 }}>✗ Not this</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink)' }}>{item.dont}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCultureCards({ items }: { items: { group: string; cues: string }[] }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 className="display" style={{ fontSize: 22, color: 'var(--brand-deep)', marginBottom: 16 }}>
        Reading your guest
      </h3>
      <div className="culture-grid">
        {items.map((c, i) => (
          <div key={i} className="culture-card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--brand-deep)' }}>{c.group}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{c.cues}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTipList({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 className="display" style={{ fontSize: 20, color: 'var(--brand-deep)', marginBottom: 14 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px', background: 'white', border: '1px solid var(--sand-deeper)', borderRadius: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--brand)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink)' }}>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderSection(section: LearnSection, idx: number) {
  switch (section.type) {
    case 'intro': return <SectionIntro key={idx} text={section.text} />;
    case 'callout': return <SectionCallout key={idx} tone={section.tone} label={section.label} text={section.text} />;
    case 'principles': return <SectionPrinciples key={idx} items={section.items} />;
    case 'steps': return <SectionSteps key={idx} title={section.title} items={section.items} />;
    case 'lang-grid': return <SectionLangGrid key={idx} items={section.items} />;
    case 'phrase-table': return <SectionPhraseTable key={idx} rows={section.rows} />;
    case 'do-dont': return <SectionDoDont key={idx} title={section.title} items={section.items} />;
    case 'culture-cards': return <SectionCultureCards key={idx} items={section.items} />;
    case 'tip-list': return <SectionTipList key={idx} title={section.title} items={section.items} />;
    default: return null;
  }
}

// ─── Main component ───────────────────────────────────────────

interface LearnPhaseProps {
  lesson: Lesson;
  onAdvance: () => void;
}

export default function LearnPhase({ lesson, onAdvance }: LearnPhaseProps) {
  if (lesson.learn.length === 0) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div className="label-mono">Content coming soon</div>
        <h2 className="display" style={{ fontSize: 28, color: 'var(--brand-deep)', margin: '12px 0' }}>
          {lesson.title}
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 28 }}>
          This lesson is being finalized. Check back shortly.
        </p>
        <button className="btn-brand" onClick={onAdvance}>
          Continue to Practice <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {lesson.learn.map((section, i) => renderSection(section, i))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40 }}>
        <button className="btn-brand" onClick={onAdvance}>
          Ready to practice <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
