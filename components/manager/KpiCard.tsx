'use client';

import { TrendingUp, AlertTriangle } from 'lucide-react';
import type { ElementType, ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'warn' | 'flat';
  icon: ElementType;
  accent: string;
  children?: ReactNode;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`)
    .join(' ');
  return (
    <svg width="100%" height="40" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export { Sparkline };

export default function KpiCard({ label, value, delta, trend, icon: Icon, accent, children }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="label-mono">{label}</div>
          <div className="kpi-value">{value}</div>
        </div>
        <div className="kpi-icon" style={{ background: `${accent}18`, color: accent }}>
          <Icon size={18} />
        </div>
      </div>
      <div className={`kpi-delta ${trend}`}>
        {trend === 'up' && <TrendingUp size={11} />}
        {trend === 'warn' && <AlertTriangle size={11} />}
        {delta}
      </div>
      <div className="kpi-visual">{children}</div>
    </div>
  );
}
