'use client';

import { useEffect, useRef, useState } from 'react';
import { Timer } from 'lucide-react';
import type { SprintRound as SprintRoundConfig } from '@/lib/exam';

// Round 3 — Scenario Sprint. Rapid-fire situational questions, one timer each.
// Picking an answer locks it and auto-advances; an expired timer records null
// (unanswered) and moves on. No right/wrong reveal mid-round.

interface Props {
  round: SprintRoundConfig;
  onComplete: (answers: (number | null)[]) => void;
}

const TICK_MS = 100;

export default function SprintRound({ round, onComplete }: Props) {
  const [qIdx, setQIdx] = useState(0);
  const [msLeft, setMsLeft] = useState(round.secondsPerQuestion * 1000);
  const [selected, setSelected] = useState<number | null>(null);
  const answersRef = useRef<(number | null)[]>([]);
  // Guards the timeout path so a tick landing after a selection can't advance twice.
  const lockedRef = useRef(false);

  const q = round.questions[qIdx];

  const advance = (answer: number | null) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    answersRef.current[qIdx] = answer;
    setSelected(answer);
    setTimeout(() => {
      if (qIdx + 1 >= round.questions.length) {
        onComplete(answersRef.current);
      } else {
        lockedRef.current = false;
        setSelected(null);
        setMsLeft(round.secondsPerQuestion * 1000);
        setQIdx(qIdx + 1);
      }
    }, 350);
  };

  // Countdown for the current question. The remaining time lives in a ref
  // (state is display-only) so the timeout side effect never runs inside a
  // state updater.
  const msLeftRef = useRef(msLeft);
  useEffect(() => {
    msLeftRef.current = round.secondsPerQuestion * 1000;
    const interval = setInterval(() => {
      if (lockedRef.current) return;
      msLeftRef.current -= TICK_MS;
      if (msLeftRef.current <= 0) {
        clearInterval(interval);
        setMsLeft(0);
        advance(null);
        return;
      }
      setMsLeft(msLeftRef.current);
    }, TICK_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx]);

  const ratio = msLeft / (round.secondsPerQuestion * 1000);
  const secondsLeft = Math.ceil(msLeft / 1000);
  const urgent = secondsLeft <= 5;

  return (
    <div className="animate-fade-up" key={qIdx}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="label-mono">Question {qIdx + 1} of {round.questions.length}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums', color: urgent ? 'var(--coral-deep)' : 'var(--brand-deep)' }}>
          <Timer size={15} /> {secondsLeft}s
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ height: 6, borderRadius: 999, background: 'var(--sand-deeper)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ width: `${ratio * 100}%`, height: '100%', borderRadius: 999, background: urgent ? 'var(--coral-deep)' : 'var(--brand)', transition: `width ${TICK_MS}ms linear` }} />
      </div>

      <div className="card" style={{ padding: 32 }}>
        <h3 className="display" style={{ fontSize: 21, color: 'var(--brand-deep)', lineHeight: 1.35, marginBottom: 24 }}>
          {q.q}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`quiz-opt${selected === i ? ' is-selected' : selected !== null ? ' is-faded' : ''}`}
              onClick={() => advance(i)}
              disabled={selected !== null}
            >
              <span style={{ flex: 1, textAlign: 'left' }}>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
