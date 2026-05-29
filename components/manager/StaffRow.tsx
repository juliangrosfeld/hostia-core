'use client';

import { useState } from 'react';
import { ChevronRight, Pencil } from 'lucide-react';
import type { StaffMember } from '@/lib/staff-data';

const STATUS_LABEL: Record<StaffMember['status'], string> = {
  star: 'Star',
  active: 'Active',
  developing: 'Growing',
  'at-risk': 'At risk',
  new: 'New',
};

export default function StaffRow({ staff: s, onClick, onEdit }: { staff: StaffMember; onClick: () => void; onEdit: () => void }) {
  const [hovered, setHovered] = useState(false);
  const pct = (s.lessons / s.total) * 100;
  const scoreColor =
    s.score >= 80 ? 'var(--sage-deep)' : s.score >= 60 ? 'var(--gold-deep)' : 'var(--coral-deep)';
  const lastActiveDanger =
    s.lastActive.includes('day') && parseInt(s.lastActive) > 3;

  return (
    <div
      className="roster-row"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Name + avatar */}
      <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div className="row-avatar" style={{ background: s.color }}>
          {s.initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{s.role}</div>
        </div>
      </div>

      {/* Dept */}
      <div style={{ flex: 1.2, fontSize: 13, color: 'var(--ink-soft)' }}>{s.dept}</div>

      {/* Level */}
      <div style={{ width: 70, fontSize: 13, fontWeight: 600 }}>L{s.level}</div>

      {/* Score */}
      <div
        style={{
          width: 80,
          fontFamily: 'Fraunces, serif',
          fontSize: 20,
          fontWeight: 500,
          color: scoreColor,
        }}
      >
        {s.score}
      </div>

      {/* Progress bar */}
      <div style={{ flex: 1.2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 5, background: 'var(--sand-warm)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {s.lessons}/{s.total}
          </span>
        </div>
      </div>

      {/* Last active */}
      <div style={{ width: 110, fontSize: 12, color: lastActiveDanger ? 'var(--coral-deep)' : 'var(--ink-soft)' }}>
        {s.lastActive}
      </div>

      {/* Status pill */}
      <div style={{ width: 80 }}>
        <span className={`status-pill status-${s.status}`}>{STATUS_LABEL[s.status]}</span>
      </div>

      {/* Edit + arrow */}
      <div style={{ width: 64, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit staff member"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 7,
              border: '1.5px solid var(--sand-deeper)',
              background: 'white', cursor: 'pointer',
              color: 'var(--ink-soft)', flexShrink: 0,
              transition: 'color 0.1s, border-color 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand-deep)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-soft)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sand-deeper)';
            }}
          >
            <Pencil size={12} />
          </button>
        )}
        <div style={{ color: 'var(--ink-soft)', display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
}
