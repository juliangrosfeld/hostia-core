'use client';

import { ChevronRight } from 'lucide-react';
import type { ElementType } from 'react';

interface InsightCardProps {
  tone: 'warn' | 'alert' | 'good';
  icon: ElementType;
  title: string;
  body: string;
  /** CTA renders only when BOTH label and handler are provided — an insight
   *  with no action is informational, and a button that does nothing is worse
   *  than no button. */
  cta?: string;
  onCta?: () => void;
}

export default function InsightCard({ tone, icon: Icon, title, body, cta, onCta }: InsightCardProps) {
  return (
    <div className={`insight-card insight-${tone}`}>
      <div className="insight-icon">
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="insight-title">{title}</div>
        <div className="insight-body">{body}</div>
        {cta && onCta && (
          <button className="insight-cta" onClick={onCta}>
            {cta} <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
