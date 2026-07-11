'use client';

import { useRef, useState } from 'react';
import { ChevronRight, Flag } from 'lucide-react';
import type { FinalChallengeRound as FinalChallengeRoundConfig } from '@/lib/exam';

// Round 4 — Final Challenge. One continuous shift story, decided beat by beat.
// Unlike the earlier rounds, each locked choice reveals its coaching feedback:
// the capstone doubles as the exam's teaching moment. Points stay hidden until
// the results screen.

interface Props {
  round: FinalChallengeRoundConfig;
  onComplete: (answers: Record<string, number>) => void;
}

export default function FinalChallengeRound({ round, onComplete }: Props) {
  const [beatIdx, setBeatIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const answersRef = useRef<Record<string, number>>({});

  const beat = round.beats[beatIdx];
  const chosen = selected !== null ? beat.options[selected] : null;

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    answersRef.current[beat.id] = i;
  };

  const next = () => {
    if (beatIdx + 1 >= round.beats.length) {
      onComplete(answersRef.current);
    } else {
      setSelected(null);
      setBeatIdx(beatIdx + 1);
    }
  };

  return (
    <div className="animate-fade-up" key={beat.id}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="label-mono" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flag size={12} /> Scene {beatIdx + 1} of {round.beats.length}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {round.beats.map((_, i) => (
            <div key={i} style={{ width: 20, height: 4, borderRadius: 2, background: i < beatIdx ? 'var(--brand)' : i === beatIdx ? 'var(--brand-deep)' : 'var(--sand-deeper)' }} />
          ))}
        </div>
      </div>

      {/* The story beat */}
      <div style={{ padding: '20px 24px', borderRadius: 14, background: 'var(--ocean-deep)', marginBottom: 16 }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontStyle: 'italic', color: 'rgba(250,247,242,0.92)', lineHeight: 1.6, margin: 0 }}>
          {beat.setup}
        </p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <h3 className="display" style={{ fontSize: 21, color: 'var(--brand-deep)', lineHeight: 1.35, marginBottom: 24 }}>
          {beat.prompt}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {beat.options.map((opt, i) => {
            let cls = 'quiz-opt';
            if (selected !== null) cls += i === selected ? ' is-selected' : ' is-faded';
            return (
              <button key={i} className={cls} onClick={() => choose(i)} disabled={selected !== null}>
                <span style={{ flex: 1, textAlign: 'left' }}>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {chosen && (
          <div className="feedback is-correct" style={{ background: 'var(--sand-warm)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Coach&apos;s read</div>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>{chosen.feedback}</div>
          </div>
        )}
      </div>

      {selected !== null && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-brand" onClick={next}>
            {beatIdx + 1 >= round.beats.length ? 'Finish the shift' : 'Continue the shift'} <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
