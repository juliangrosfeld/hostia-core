'use client';

import { useMemo, useRef, useState } from 'react';
import type { SortMatchRound as SortMatchRoundConfig } from '@/lib/exam';

// Round 1 — Sort & Match. One card at a time from a stack; the staff member
// taps a bucket (or swipes left/right on touch) to sort it. No per-card
// right/wrong reveal — this is the exam, scores land on the results screen.

interface Props {
  round: SortMatchRoundConfig;
  onComplete: (answers: Record<string, string>) => void;
}

// Horizontal travel (px) that commits a swipe.
const SWIPE_COMMIT_PX = 90;

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function SortMatchRound({ round, onComplete }: Props) {
  // Play order is shuffled once per run so retakes don't memorize positions.
  const cards = useMemo(() => shuffle(round.cards), [round.cards]);
  const [idx, setIdx] = useState(0);
  const answersRef = useRef<Record<string, string>>({});
  // Live swipe offset for the top card; null when not dragging.
  const [dragX, setDragX] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  // 'left' | 'right' while the fling-out animation plays.
  const [flying, setFlying] = useState<'left' | 'right' | null>(null);

  const card = cards[idx];
  const [leftBucket, rightBucket] = round.buckets;

  const commit = (bucketId: string, direction: 'left' | 'right') => {
    if (flying || !card) return;
    answersRef.current[card.id] = bucketId;
    setFlying(direction);
    setDragX(null);
    setTimeout(() => {
      setFlying(null);
      if (idx + 1 >= cards.length) {
        onComplete(answersRef.current);
      } else {
        setIdx(idx + 1);
      }
    }, 260);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (flying) return;
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (flying || touchStartX.current === null) return;
    setDragX(e.touches[0].clientX - touchStartX.current);
  };
  const onTouchEnd = () => {
    if (flying || touchStartX.current === null) return;
    const dx = dragX ?? 0;
    touchStartX.current = null;
    if (dx <= -SWIPE_COMMIT_PX) commit(leftBucket.id, 'left');
    else if (dx >= SWIPE_COMMIT_PX) commit(rightBucket.id, 'right');
    else setDragX(null);
  };

  const x = flying === 'left' ? -520 : flying === 'right' ? 520 : (dragX ?? 0);
  const rotation = x / 22;
  // While dragging, tint toward the bucket the card is heading for.
  const leaning = x <= -30 ? 'left' : x >= 30 ? 'right' : null;

  return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="label-mono">Card {idx + 1} of {cards.length}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {cards.map((_, i) => (
            <div key={i} style={{ width: 16, height: 4, borderRadius: 2, background: i < idx ? 'var(--brand)' : 'var(--sand-deeper)' }} />
          ))}
        </div>
      </div>

      {/* Card stack */}
      <div style={{ position: 'relative', height: 240, marginBottom: 24 }}>
        {/* Peek of the next card underneath */}
        {idx + 1 < cards.length && (
          <div className="card" aria-hidden="true" style={{ position: 'absolute', inset: 0, transform: 'scale(0.95) translateY(12px)', opacity: 0.5 }} />
        )}
        {card && (
          <div
            className="card"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '28px 32px', textAlign: 'center',
              touchAction: 'pan-y',
              cursor: 'grab',
              transform: `translateX(${x}px) rotate(${rotation}deg)`,
              transition: dragX !== null ? 'none' : 'transform 0.25s ease, opacity 0.25s ease',
              opacity: flying ? 0 : 1,
              borderColor: leaning === 'left' ? 'var(--coral-deep, #C25B43)' : leaning === 'right' ? 'var(--sage-deep)' : undefined,
            }}
          >
            <p className="display" style={{ fontSize: 19, lineHeight: 1.45, color: 'var(--brand-deep)', margin: 0 }}>
              {card.text}
            </p>
          </div>
        )}
      </div>

      {/* Bucket buttons — tap targets; swiping left/right does the same */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button
          className="quiz-opt"
          style={{ justifyContent: 'center', textAlign: 'center', fontWeight: 700, borderColor: leaning === 'left' ? 'var(--coral-deep, #C25B43)' : undefined }}
          onClick={() => commit(leftBucket.id, 'left')}
          disabled={Boolean(flying)}
        >
          {leftBucket.label}
        </button>
        <button
          className="quiz-opt"
          style={{ justifyContent: 'center', textAlign: 'center', fontWeight: 700, borderColor: leaning === 'right' ? 'var(--sage-deep)' : undefined }}
          onClick={() => commit(rightBucket.id, 'right')}
          disabled={Boolean(flying)}
        >
          {rightBucket.label}
        </button>
      </div>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-soft)', marginTop: 14 }}>
        Tap a bucket — or swipe the card left / right
      </p>
    </div>
  );
}
