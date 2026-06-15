'use client';

import { ChevronRight } from 'lucide-react';
import type { ElementType } from 'react';

interface InsightCardProps {
  tone: 'warn' | 'alert' | 'good';
  icon: ElementType;
  title: string;
  body: string;
  cta: string;
}

export default function InsightCard({ tone, icon: Icon, title, body, cta }: InsightCardProps) {
  return (
    <div className={`insight-card insight-${tone}`}>
      <div className="insight-icon">
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="insight-title">{title}</div>
        <div className="insight-body">{body}</div>
        <button className="insight-cta">
          {cta} <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
