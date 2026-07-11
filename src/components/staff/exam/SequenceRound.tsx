'use client';

import { useMemo, useRef, useState } from 'react';
import { GripVertical, ChevronRight } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  arrayMove, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SequenceRound as SequenceRoundConfig } from '@/lib/exam';

// Round 2 — Sequence Builder. Each protocol's steps arrive shuffled; the staff
// member drags them into order and locks the sequence in. Answers report the
// arranged ORIGINAL indexes, which is what the grader scores positionally.

interface Props {
  round: SequenceRoundConfig;
  onComplete: (answers: Record<string, number[]>) => void;
}

// A shuffle that never returns the already-correct order (that would hand out
// free points on short sequences).
function shuffledIndexes(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (length > 1 && arr.every((v, i) => v === i));
  return arr;
}

function SortableStep({ id, text, position }: { id: string; text: string; position: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px',
        background: 'white',
        border: `1.5px solid ${isDragging ? 'var(--brand)' : 'var(--sand-deeper)'}`,
        borderRadius: 12,
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
        zIndex: isDragging ? 2 : undefined,
        position: 'relative',
        cursor: 'grab',
        touchAction: 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--sand-warm)', color: 'var(--brand-deep)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {position}
      </span>
      <span style={{ flex: 1, fontSize: 14, lineHeight: 1.45 }}>{text}</span>
      <GripVertical size={16} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
    </div>
  );
}

export default function SequenceRound({ round, onComplete }: Props) {
  const [seqIdx, setSeqIdx] = useState(0);
  const answersRef = useRef<Record<string, number[]>>({});
  const seq = round.sequences[seqIdx];

  // The current arrangement as original step indexes; re-shuffled per sequence.
  const [order, setOrder] = useState<number[]>(() => shuffledIndexes(seq.steps.length));
  const initialOrders = useMemo(
    () => round.sequences.map((s) => shuffledIndexes(s.steps.length)),
    [round.sequences],
  );

  const sensors = useSensors(
    // Small activation distance keeps taps from starting accidental drags.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = order.map((originalIdx) => `step-${originalIdx}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    setOrder((prev) => arrayMove(prev, from, to));
  };

  const lockIn = () => {
    answersRef.current[seq.id] = order;
    if (seqIdx + 1 >= round.sequences.length) {
      onComplete(answersRef.current);
    } else {
      setSeqIdx(seqIdx + 1);
      setOrder(initialOrders[seqIdx + 1]);
    }
  };

  return (
    <div className="animate-fade-up" key={seq.id}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="label-mono">Sequence {seqIdx + 1} of {round.sequences.length}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {round.sequences.map((_, i) => (
            <div key={i} style={{ width: 24, height: 4, borderRadius: 2, background: i < seqIdx ? 'var(--brand)' : i === seqIdx ? 'var(--brand-deep)' : 'var(--sand-deeper)' }} />
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <h3 className="display" style={{ fontSize: 20, color: 'var(--brand-deep)', lineHeight: 1.35, marginBottom: 20 }}>
          {seq.prompt}
        </h3>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {order.map((originalIdx, pos) => (
                <SortableStep
                  key={`step-${originalIdx}`}
                  id={`step-${originalIdx}`}
                  text={seq.steps[originalIdx]}
                  position={pos + 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn-brand" onClick={lockIn}>
          {seqIdx + 1 >= round.sequences.length ? 'Lock in & finish round' : 'Lock in order'} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
