'use client';

import { ChevronRight } from 'lucide-react';
import type { ElementType } from 'react';
import InfoDot from './InfoDot';

interface InsightCardProps {
  tone: 'warn' | 'alert' | 'good';
  icon: ElementType;
  title: string;
  body: string;
  /** Short explanation of what this insight watches, revealed by an ⓘ dot in
   *  the card's top-right corner. */
  info?: string;
  /** Accessible name for the ⓘ dot — the card kind, not the dynamic title. */
  infoLabel?: string;
  /** CTA renders only when BOTH label and handler are provided — an insight
   *  with no action is informational, and a button that does nothing is worse
   *  than no button. */
  cta?: string;
  onCta?: () => void;
}

export default function InsightCard({ tone, icon: Icon, title, body, info, infoLabel, cta, onCta }: InsightCardProps) {
  return (
    <div className={`insight-card insight-${tone}`} style={{ position: 'relative' }}>
      <div className="insight-icon">
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingRight: info ? 20 : 0 }}>
        <div className="insight-title">{title}</div>
        <div className="insight-body">{body}</div>
        {cta && onCta && (
          <button className="insight-cta" onClick={onCta}>
            {cta} <ChevronRight size={12} />
          </button>
        )}
      </div>
      {info && (
        <span style={{ position: 'absolute', top: 12, right: 12 }}>
          <InfoDot label={infoLabel ?? title} text={info} align="right" />
        </span>
      )}
    </div>
  );
}
