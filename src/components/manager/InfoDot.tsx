'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

interface InfoDotProps {
  /** Card name the explanation belongs to — used for the accessible label. */
  label: string;
  /** The short explanation revealed by the icon. */
  text: string;
  /** Which edge of the icon the popover hangs from (default 'left'). */
  align?: 'left' | 'right';
}

// Small ⓘ button that reveals a one-paragraph explanation of a dashboard
// card. It must never interfere with a card's own click behavior (phase
// tiles filter, insight CTAs navigate), so every pointer event stops here.
// Dismiss: re-tap, tap/click anywhere else, or Escape.
export default function InfoDot({ label, text, align = 'left' }: InfoDotProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="info-dot"
        aria-label={`What does “${label}” mean?`}
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <Info size={12} strokeWidth={2.25} />
      </button>
      {open && (
        <div
          id={popId}
          role="note"
          className="info-pop"
          style={align === 'right' ? { right: 0 } : { left: 0 }}
        >
          <div className="label-mono" style={{ fontSize: 9, marginBottom: 5 }}>{label}</div>
          {text}
        </div>
      )}
    </span>
  );
}
