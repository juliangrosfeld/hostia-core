'use client';

import { useEffect, useState } from 'react';
import {
  Bell, Activity, Users, GraduationCap, Award,
  TrendingUp, TrendingDown, AlertTriangle, Star, AlertCircle,
  Check, Play, MessageSquare, Plus, Pencil, X, Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';

import {
  STAFF, SKILL_LABELS, TREND_DATA, RECENT_ACTIVITY,
  type StaffMember,
} from '@/lib/staff-data';
import { PROPERTY } from '@/lib/config';
import { useUser } from '@/lib/useUser';

import KpiCard, { Sparkline } from './KpiCard';
import InsightCard from './InsightCard';
import StaffRow from './StaffRow';

// ─── Real-data dashboard payload (see /api/manager/dashboard) ─────────────────

interface DashboardData {
  isDemo: false;
  totalStaff: number;
  activeStaff: number;
  atRisk: number;
  activeAvatars: { initials: string; full_name: string; color: string }[];
  teamHealth: { current: number; delta: number };
  lessons: { thisWeek: number; deltaPercent: number | null };
  certified: { count: number; total: number; closeToCount: number };
  trendChart: { date: string; score: number }[];
  skillGaps: { module_id: string; module_title: string; score: number; color: string }[];
  insights: {
    weakestSkill: { module_id: string; module_title: string; score: number; message: string } | null;
    atRiskStaff: { count: number; names: string[]; message: string };
    topPerformer: { full_name: string; first_name: string; badges: number; streak: number; score: number } | null;
  };
  roster: StaffMember[];
}

type DemoResponse = { isDemo: true };
type DashboardResponse = DashboardData | DemoResponse;

// Format an integer points-delta into the standard "+X pts in 30 days" copy.
function formatPtsDelta(delta: number): string {
  if (delta > 0) return `+${delta} pts in 30 days`;
  if (delta < 0) return `${delta} pts in 30 days`;
  return 'No change in 30 days';
}

// ─── Loading skeleton — keeps the layout, shimmers the metrics ───────────────

function Skel({ w, h = 14, style }: { w: number | string; h?: number; style?: React.CSSProperties }) {
  return <span className="skel" style={{ width: w, height: h, ...style }} />;
}

function DashboardSkeleton() {
  return (
    <div className="mgr-page">
      <div className="container">
        <div className="mgr-header">
          <div>
            <div className="label-mono">Manager dashboard · Last 30 days</div>
            <h1 className="display mgr-title">Good evening.</h1>
            <p className="mgr-sub">Loading your team's performance…</p>
          </div>
        </div>

        <div className="kpi-row">
          {['Team health', 'Active', 'Lessons', 'Certified'].map((label) => (
            <div key={label} className="kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="label-mono">{label}</div>
                  <div className="kpi-value"><Skel w={70} h={28} /></div>
                </div>
                <div className="kpi-icon" style={{ background: 'var(--sand-warm)' }} />
              </div>
              <div style={{ marginTop: 12 }}><Skel w={120} h={12} /></div>
              <div className="kpi-visual"><Skel w="100%" h={40} style={{ borderRadius: 8 }} /></div>
            </div>
          ))}
        </div>

        <div className="chart-row">
          {[0, 1].map((i) => (
            <div key={i} className="card chart-card">
              <div className="card-head">
                <div>
                  <div className="label-mono">{i === 0 ? 'Team average score' : 'Skill gaps'}</div>
                  <div className="card-title"><Skel w={140} h={16} /></div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}><Skel w="100%" h={i === 0 ? 200 : 160} style={{ borderRadius: 10 }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CRUD helpers ────────────────────────────────────────────

const COLOR_PRESETS = [
  { value: '#F5A623', label: 'Brand yellow' },
  { value: '#E07A5F', label: 'Coral' },
  { value: '#81B29A', label: 'Sage green' },
  { value: '#D4A574', label: 'Gold' },
  { value: '#8DA9C4', label: 'Ocean blue' },
  { value: '#4A5568', label: 'Slate' },
];

const ROLE_DEPT: Record<string, string> = {
  'Mesero':  'Floor',
  'Runner':  'Floor',
  'Capitán': 'Floor',
  'Bar Staff': 'Bar',
  'Kitchen': 'Kitchen',
  'Manager': 'Management',
};

const ROLES = Object.keys(ROLE_DEPT);

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

function makeId(): string {
  return `s-${Date.now()}`;
}

// ─── Activity feed ───────────────────────────────────────────

type ActivityType = 'completion' | 'badge' | 'start' | 'roleplay' | 'low-score';

const ICON_MAP: Record<ActivityType, React.ElementType> = {
  completion: Check, badge: Award, start: Play, roleplay: MessageSquare, 'low-score': AlertTriangle,
};
const COLOR_MAP: Record<ActivityType, string> = {
  completion: '#81B29A', badge: '#F5A623', start: '#8DA9C4', roleplay: '#111111', 'low-score': '#E07A5F',
};

function ActivityItem({
  who, what, score, when, type, isLast,
}: { who: string; what: string; score?: number; when: string; type: ActivityType; isLast: boolean }) {
  const Icon = ICON_MAP[type];
  const color = COLOR_MAP[type];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid var(--sand-deeper)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} />
      </div>
      <div style={{ flex: 1, fontSize: 14 }}>
        <b>{who}</b>{' '}{what}
        {score != null && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--ink-soft)' }}>· score {score}%</span>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{when}</div>
    </div>
  );
}

// ─── Form state type ─────────────────────────────────────────

interface FormState { name: string; role: string; color: string; email: string; password: string; }
const BLANK_FORM: FormState = { name: '', role: 'Mesero', color: '#F5A623', email: '', password: '' };

// ─── Main dashboard ──────────────────────────────────────────

interface ManagerDashboardProps {
  onOpenStaff: (s: StaffMember) => void;
}

export default function ManagerDashboard({ onOpenStaff }: ManagerDashboardProps) {
  const [filter, setFilter] = useState<string>('all');
  const [staffList, setStaffList] = useState<StaffMember[]>([...STAFF]);

  // Logged-in manager + their property. Drives the greeting + property name on
  // BOTH the demo and real paths (so the demo screen now shows real names too).
  const { user, property } = useUser();
  const managerFirstName = user?.full_name?.trim()
    ? user.full_name.trim().split(/\s+/)[0]
    : (user?.email ? user.email.split('@')[0] : '');
  const propertyName = property?.name ?? PROPERTY.name;

  // Real-data plumbing. status drives which render path we take:
  //  - 'loading' → skeleton
  //  - 'demo'    → existing hardcoded mock (Hostia Demo property only)
  //  - 'real'    → live Supabase metrics for the manager's property
  const [status, setStatus] = useState<'loading' | 'demo' | 'real'>('loading');
  const [realData, setRealData] = useState<DashboardData | null>(null);

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/manager/dashboard');
      if (!res.ok) { setStatus('demo'); return; } // fail safe → never blank the screen
      const data: DashboardResponse = await res.json();
      if (data.isDemo) {
        setStaffList([...STAFF]);
        setStatus('demo');
      } else {
        setRealData(data);
        setStaffList(data.roster);
        setStatus('real');
      }
    } catch {
      setStatus('demo');
    }
  }

  useEffect(() => { fetchDashboard(); }, []);

  const isReal = status === 'real' && realData != null;

  // Modal state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [nameError, setNameError] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── CRUD actions ─────────────────────────────────────────
  const openAdd = () => {
    setForm(BLANK_FORM);
    setEditTarget(null);
    setNameError(false);
    setShowRemoveConfirm(false);
    setSubmitError(null);
    setModalMode('add');
  };

  const openEdit = (s: StaffMember) => {
    setForm({ name: s.name, role: s.role, color: s.color, email: '', password: '' });
    setEditTarget(s);
    setNameError(false);
    setShowRemoveConfirm(false);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
    setShowRemoveConfirm(false);
    setSubmitError(null);
  };

  const handleAdd = async () => {
    if (!form.name.trim()) { setNameError(true); return; }
    if (!form.email.trim() || !form.password.trim()) {
      setSubmitError('Email and password are required');
      return;
    }
    if (form.password.length < 8) {
      setSubmitError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: 'staff',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to create staff member');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      closeModal();

      if (isReal) {
        // Real property → re-pull the dashboard so the new hire appears with
        // their actual id and (zeroed) real metrics rather than a local stub.
        fetchDashboard();
      } else {
        const member: StaffMember = {
          id: makeId(),
          name: form.name.trim(),
          initials: makeInitials(form.name),
          role: form.role,
          dept: ROLE_DEPT[form.role] ?? 'Floor',
          level: 1,
          xp: 0,
          streak: 0,
          score: 0,
          lessons: 0,
          total: 28,
          lastActive: 'Just added',
          status: 'new',
          joined: 'Today',
          color: form.color,
          badges: 0,
          skills: { greetings: 0, serviceFlow: 0, language: 0, complaints: 0, floor: 0, guestPsychology: 0, casualDiningFloor: 0 },
        };
        setStaffList((prev) => [...prev, member]);
      }
    } catch (err) {
      setSubmitError('Network error — please try again');
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (!form.name.trim()) { setNameError(true); return; }
    setStaffList((prev) => prev.map((s) =>
      s.id !== editTarget?.id ? s : {
        ...s,
        name: form.name.trim(),
        initials: makeInitials(form.name),
        role: form.role,
        dept: ROLE_DEPT[form.role] ?? s.dept,
        color: form.color,
      }
    ));
    closeModal();
  };

  const handleRemove = () => {
    setStaffList((prev) => prev.filter((s) => s.id !== editTarget?.id));
    closeModal();
  };

  // ── KPI math ─────────────────────────────────────────────
  const n = staffList.length;
  const teamAvg  = n > 0 ? Math.round(staffList.reduce((a, s) => a + s.score, 0) / n) : 0;
  const activeStaff = staffList.filter(
    (s) => s.lastActive.includes('m ago') || s.lastActive.includes('h ago') || s.lastActive === '1d ago'
  ).length;
  const atRisk   = staffList.filter((s) => s.status === 'at-risk').length;
  const certified = staffList.filter((s) => s.lessons >= 20).length;
  const stars     = staffList.filter((s) => s.status === 'star');

  // Skill averages sorted weakest first
  const skillAverages = (Object.keys(SKILL_LABELS) as (keyof typeof SKILL_LABELS)[])
    .map((k) => ({
      key: k,
      skill: SKILL_LABELS[k],
      avg: n > 0 ? Math.round(staffList.reduce((a, s) => a + s.skills[k], 0) / n) : 0,
    }))
    .sort((a, b) => a.avg - b.avg);

  const weakest = skillAverages[0];

  // Filtered roster
  const depts = ['all', ...Array.from(new Set(staffList.map((s) => s.dept)))];
  let filtered: StaffMember[];
  if (filter === 'at-risk')    filtered = staffList.filter((s) => s.status === 'at-risk');
  else if (filter === 'star')  filtered = staffList.filter((s) => s.status === 'star');
  else if (filter === 'all')   filtered = staffList;
  else                         filtered = staffList.filter((s) => s.dept === filter);
  filtered = [...filtered].sort((a, b) => b.score - a.score);

  // ── Display values ───────────────────────────────────────
  // Every metric is sourced from real data when isReal, otherwise from the mock
  // computations above. The JSX below is a single tree bound to these so the
  // demo render stays byte-for-byte identical to before.
  const displayStaffCount = isReal ? realData!.totalStaff : n;
  const displayActive     = isReal ? realData!.activeStaff : activeStaff;
  const displayAtRisk     = isReal ? realData!.atRisk : atRisk;

  // Team health
  const healthValue     = isReal ? realData!.teamHealth.current : teamAvg;
  const healthDelta     = isReal ? realData!.teamHealth.delta : 15;
  const healthDeltaText = isReal ? formatPtsDelta(healthDelta) : '+15 pts in 30 days';
  const healthTrend: 'up' | 'warn' | 'flat' =
    isReal ? (healthDelta > 0 ? 'up' : healthDelta < 0 ? 'warn' : 'flat') : 'up';
  const healthSpark = isReal ? realData!.trendChart.map((d) => d.score) : TREND_DATA.map((d) => d.score);

  // Lessons
  const lessonsDelta = isReal ? realData!.lessons.deltaPercent : null;
  const lessonsValue = isReal ? String(realData!.lessons.thisWeek) : '38';
  // Both this week and last week are zero when there's no lesson activity at all.
  // deltaPercent is only 0 here when last week was also 0 (else thisWeek=0 → -100%).
  const lessonsBothZero = isReal && realData!.lessons.thisWeek === 0 && lessonsDelta === 0;
  const lessonsDeltaText = isReal
    ? (lessonsBothZero
        ? 'no lessons yet'
        : lessonsDelta === null
          ? 'new this week'
          : `${lessonsDelta >= 0 ? '+' : ''}${lessonsDelta}% vs last week`)
    : '+22% vs last week';
  const lessonsTrend: 'up' | 'warn' | 'flat' = isReal
    ? (lessonsDelta === null || lessonsDelta > 0 ? 'up' : lessonsDelta < 0 ? 'warn' : 'flat')
    : 'up';
  const lessonBars = isReal && realData!.lessons.thisWeek === 0 ? [2, 2, 2, 2, 2, 2, 2] : [4, 6, 5, 8, 7, 6, 5];

  // Certified
  const certifiedValue = isReal ? `${realData!.certified.count}/${realData!.certified.total}` : `${certified}/${n}`;
  const certifiedDeltaText = isReal ? `${realData!.certified.closeToCount} close to certification` : '2 close to certification';
  const certPct = isReal
    ? (realData!.certified.total > 0 ? (realData!.certified.count / realData!.certified.total) * 100 : 0)
    : (n > 0 ? (certified / n) * 100 : 0);

  // Trend chart
  const chartData: { day: string; score: number }[] = isReal
    ? realData!.trendChart.map((d) => ({ day: d.date.slice(5), score: d.score }))
    : TREND_DATA.map((d) => ({ day: String(d.day), score: d.score }));
  const chartDomain: [number, number] = isReal ? [0, 100] : [50, 100];
  const chartTrendUp = isReal ? healthDelta >= 0 : true;
  const chartChipClass = isReal ? (healthDelta > 0 ? 'up' : healthDelta < 0 ? 'down' : 'flat') : 'up';

  // Skill gaps (weakest first)
  const skillRows = isReal
    ? realData!.skillGaps.map((g) => ({ key: g.module_id, skill: g.module_title, avg: g.score }))
    : skillAverages;
  // Only flag a "WEAKEST" skill once there's real signal to compare. On the real
  // path with all-zero scores, the label is meaningless — hide it. Demo: always on.
  const showWeakest = isReal ? skillRows.some((s) => s.avg > 0) : true;

  // Insight cards
  const insightWeakestTitle = isReal
    ? (realData!.insights.weakestSkill ? `${realData!.insights.weakestSkill.module_title} needs attention` : 'No skill data yet')
    : `${weakest.skill} needs attention`;
  const insightWeakestBody = isReal
    ? (realData!.insights.weakestSkill?.message ?? 'Once your team starts roleplays, skill gaps will surface here.')
    : `Team averages ${weakest.avg}% on this skill. Consider making it the focus module this week.`;

  const insightAtRiskBody = isReal
    ? realData!.insights.atRiskStaff.message
    : "Diego and Robbie haven't engaged in over a week. A nudge or quick 1:1 could re-engage them now.";

  const tp = isReal ? realData!.insights.topPerformer : null;
  const insightStarTitle = isReal
    ? (tp ? `${tp.first_name} is leading the team` : 'No star performers yet')
    : (stars[0] ? `${stars[0].name.split(' ')[0]} is leading the team` : 'No star performers yet');
  const insightStarBody = isReal
    ? (tp
        ? `${tp.badges} badge${tp.badges === 1 ? '' : 's'}, ${tp.streak}-day streak, ${tp.score}% average. Consider making them a peer coach for new hires.`
        : 'Keep engaging the team — star performers will surface as scores improve.')
    : (stars[0]
        ? `${stars[0].badges} badges, ${stars[0].streak}-day streak, ${stars[0].score}% average. Consider making them a peer coach for new hires.`
        : 'Keep engaging the team — star performers will surface as scores improve.');
  const insightStarCta = isReal
    ? (tp ? `View ${tp.first_name}` : 'See roster')
    : (stars[0] ? `View ${stars[0].name.split(' ')[0]}` : 'See roster');

  // ── Render ───────────────────────────────────────────────
  if (status === 'loading') return <DashboardSkeleton />;

  return (
    <div className="mgr-page animate-fade-up">
      <div className="container">

        {/* ─ Header ─ */}
        <div className="mgr-header">
          <div>
            <div className="label-mono">Manager dashboard · Last 30 days</div>
            <h1 className="display mgr-title">Good evening{managerFirstName ? `, ${managerFirstName}` : ''}.</h1>
            <p className="mgr-sub">Here's how {propertyName} is performing.</p>
          </div>
          <div className="mgr-meta">
            <div className="mgr-meta-item"><Users size={14} />{displayStaffCount} staff</div>
            <div className="mgr-meta-item"><Activity size={14} />{displayActive} active this week</div>
            <button className="btn-brand-sm"><Bell size={13} /> Send team nudge</button>
          </div>
        </div>

        {/* ─ KPI cards ─ */}
        <div className="kpi-row">
          <KpiCard label="Team health" value={`${healthValue}%`} delta={healthDeltaText} trend={healthTrend} icon={Activity} accent="#81B29A">
            <Sparkline data={healthSpark} color="#81B29A" />
          </KpiCard>

          <KpiCard label="Active" value={`${displayActive}/${displayStaffCount}`} delta={`${displayAtRisk} at risk`} trend={displayAtRisk > 1 ? 'warn' : 'flat'} icon={Users} accent="#111111">
            <div className="avatar-stack">
              {isReal ? (
                <>
                  {realData!.activeAvatars.map((a, i) => (
                    <div key={i} className="mini-avatar" style={{ background: a.color }}>{a.initials}</div>
                  ))}
                  {realData!.activeStaff > 6 && <div className="mini-avatar mini-avatar-more">+{realData!.activeStaff - 6}</div>}
                  {realData!.activeAvatars.length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>No active staff yet</span>
                  )}
                </>
              ) : (
                <>
                  {staffList.slice(0, 6).map((s) => (
                    <div key={s.id} className="mini-avatar" style={{ background: s.color }}>{s.initials}</div>
                  ))}
                  {n > 6 && <div className="mini-avatar mini-avatar-more">+{n - 6}</div>}
                </>
              )}
            </div>
          </KpiCard>

          <KpiCard label="Lessons" value={lessonsValue} delta={lessonsDeltaText} trend={lessonsTrend} icon={GraduationCap} accent="#D4A574">
            <div className="micro-bars">
              {lessonBars.map((v, i) => (
                <div key={i} className="micro-bar" style={{ height: `${v * 5}px`, background: '#D4A574' }} />
              ))}
            </div>
          </KpiCard>

          <KpiCard label="Certified" value={certifiedValue} delta={certifiedDeltaText} trend="flat" icon={Award} accent="#F5A623">
            <div className="cert-progress">
              <div style={{ width: `${certPct}%` }} />
            </div>
          </KpiCard>
        </div>

        {/* ─ Charts row ─ */}
        <div className="chart-row">
          <div className="card chart-card">
            <div className="card-head">
              <div>
                <div className="label-mono">Team average score</div>
                <div className="card-title">{chartTrendUp ? 'Trending up' : 'Trending down'}</div>
              </div>
              <div className={`trend-chip ${chartChipClass}`}>
                {chartTrendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {healthDeltaText}
              </div>
            </div>
            <div className="chart-area-container" style={{ height: 200, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="brandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F5A623" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DCC9" vertical={false} />
                  <XAxis dataKey="day" stroke="#4A5568" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Day', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#4A5568' }} />
                  <YAxis stroke="#4A5568" fontSize={11} tickLine={false} axisLine={false} domain={chartDomain} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--sand-deeper)', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Score']} />
                  <Area type="monotone" dataKey="score" stroke="#F5A623" strokeWidth={2.5} fill="url(#brandFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card chart-card">
            <div className="card-head">
              <div>
                <div className="label-mono">Skill gaps</div>
                <div className="card-title">Where the team is weakest</div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              {skillRows.length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
                  No roleplay scores yet — skill gaps appear once the team starts practicing.
                </div>
              )}
              {skillRows.map((s, i) => (
                <div key={s.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{ fontWeight: i === 0 ? 700 : 400, color: i === 0 ? 'var(--coral-deep)' : 'var(--ink)' }}>
                      {s.skill}
                      {i === 0 && showWeakest && <span style={{ marginLeft: 8, fontSize: 9, color: 'var(--coral-deep)', fontWeight: 700, letterSpacing: '0.1em' }}>WEAKEST</span>}
                    </span>
                    <span style={{ color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{s.avg}%</span>
                  </div>
                  <div className="skill-bar-track">
                    <div className="skill-bar-fill" style={{ width: `${s.avg}%`, background: i === 0 ? 'var(--coral)' : i === 1 ? 'var(--gold)' : 'var(--sage)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─ Insights ─ */}
        <div className="insight-row">
          <InsightCard
            tone="warn"
            icon={AlertTriangle}
            title={insightWeakestTitle}
            body={insightWeakestBody}
            cta="Assign to team"
          />
          <InsightCard
            tone="alert"
            icon={AlertCircle}
            title={`${displayAtRisk} staff at risk`}
            body={insightAtRiskBody}
            cta="Send nudge"
          />
          <InsightCard
            tone="good"
            icon={Star}
            title={insightStarTitle}
            body={insightStarBody}
            cta={insightStarCta}
          />
        </div>

        {/* ─ Team roster ─ */}
        <div className="section-head">
          <div>
            <h2 className="display section-title">Team roster</h2>
            <p className="section-sub">Click anyone to drill into their progress</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Add staff button */}
            <button
              onClick={openAdd}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                background: 'var(--brand)', border: 'none',
                color: 'var(--brand-deep)', fontWeight: 700,
                fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              <Plus size={14} /> Add staff member
            </button>

            {/* Filters */}
            <div className="filters">
              <div className="filter-group">
                {depts.map((d) => (
                  <button key={d} className={filter === d ? 'is-active' : ''} onClick={() => setFilter(d)}>
                    {d === 'all' ? 'All' : d}
                  </button>
                ))}
                <button className={`warn${filter === 'at-risk' ? ' is-active' : ''}`} onClick={() => setFilter('at-risk')}>At risk</button>
                <button className={`good${filter === 'star' ? ' is-active' : ''}`} onClick={() => setFilter('star')}>Stars</button>
              </div>
            </div>
          </div>
        </div>

        <div className="roster-table">
          <div className="roster-head">
            <div style={{ flex: 2 }}>Staff</div>
            <div style={{ flex: 1.2 }}>Department</div>
            <div style={{ width: 70 }}>Level</div>
            <div style={{ width: 80 }}>Score</div>
            <div style={{ flex: 1.2 }}>Progress</div>
            <div style={{ width: 110 }}>Last active</div>
            <div style={{ width: 80 }}>Status</div>
            <div style={{ width: 64 }} />
          </div>
          {filtered.map((s) => (
            <StaffRow
              key={s.id}
              staff={s}
              onClick={() => onOpenStaff(s)}
              onEdit={() => openEdit(s)}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14 }}>
              {staffList.length === 0
                ? 'No team members yet — add your first staff member to get started.'
                : 'No staff match this filter.'}
            </div>
          )}
        </div>

        {/* ─ Recent activity ─ */}
        <div className="activity-section">
          <h2 className="display" style={{ fontSize: 22, marginBottom: 16, color: 'var(--brand-deep)' }}>Recent activity</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {isReal ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14 }}>
                No activity yet. As your team completes lessons and roleplays, it'll show up here.
              </div>
            ) : (
              RECENT_ACTIVITY.map((a, i) => (
                <ActivityItem key={i} who={a.who} what={a.what} score={a.score} when={a.when} type={a.type} isLast={i === RECENT_ACTIVITY.length - 1} />
              ))
            )}
          </div>
        </div>

      </div>

      {/* ─ Staff CRUD Modal ─────────────────────────────── */}
      {modalMode !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(17,17,17,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'var(--sand)', borderRadius: 20,
              padding: 32, width: '100%', maxWidth: 440,
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
              animation: 'slideIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showRemoveConfirm ? (
              /* ── Confirm remove ── */
              <>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'rgba(224,122,95,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <Trash2 size={22} color="var(--coral-deep)" />
                  </div>
                  <h2 className="display" style={{ fontSize: 22, color: 'var(--brand-deep)', margin: '0 0 8px' }}>
                    Remove {editTarget?.name.split(' ')[0]} from [Property]?
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55, margin: 0 }}>
                    This cannot be undone.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 10,
                      border: 'none', background: 'var(--coral)',
                      color: 'white', fontWeight: 700, cursor: 'pointer',
                      fontSize: 14, fontFamily: 'inherit',
                    }}
                    onClick={handleRemove}
                  >
                    Remove {editTarget?.name.split(' ')[0]}
                  </button>
                  <button
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 10,
                      border: '1.5px solid var(--sand-deeper)', background: 'white',
                      fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                    }}
                    onClick={() => setShowRemoveConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              /* ── Add / Edit form ── */
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 className="display" style={{ fontSize: 24, color: 'var(--brand-deep)', margin: 0 }}>
                    {modalMode === 'add' ? 'Add staff member' : 'Edit staff member'}
                  </h2>
                  <button
                    onClick={closeModal}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', padding: 4, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Full name */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Full name <span style={{ color: 'var(--coral)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setNameError(false); }}
                    placeholder="e.g. María Perez"
                    autoFocus
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: `1.5px solid ${nameError ? 'var(--coral)' : 'var(--sand-deeper)'}`,
                      borderRadius: 10, fontSize: 14, background: 'white',
                      outline: 'none', fontFamily: 'inherit', color: 'var(--ink)',
                    }}
                  />
                  {nameError && <div style={{ fontSize: 12, color: 'var(--coral-deep)', marginTop: 4 }}>Name is required</div>}
                </div>

        {modalMode === 'add' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Email <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setSubmitError(null); }}
                placeholder="staff@example.com"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid var(--sand-deeper)',
                  borderRadius: 10, fontSize: 14, background: 'white',
                  outline: 'none', fontFamily: 'inherit', color: 'var(--ink)',
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Temporary password <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setSubmitError(null); }}
                placeholder="Min. 8 characters"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid var(--sand-deeper)',
                  borderRadius: 10, fontSize: 14, background: 'white',
                  outline: 'none', fontFamily: 'inherit', color: 'var(--ink)',
                }}
              />
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                Staff will use this to log in. Share it with them directly.
              </div>
            </div>

            {submitError && (
              <div style={{ fontSize: 13, color: 'var(--coral-deep)', background: 'var(--sand-deeper)', padding: '8px 12px', borderRadius: 8, marginBottom: 18 }}>
                {submitError}
              </div>
            )}
          </>
        )}

                {/* Role */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1.5px solid var(--sand-deeper)',
                      borderRadius: 10, fontSize: 14, background: 'white',
                      outline: 'none', fontFamily: 'inherit', cursor: 'pointer', color: 'var(--ink)',
                    }}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Department (auto-filled, read-only) */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Department{' '}
                    <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: 0, textTransform: 'none', opacity: 0.7 }}>
                      (auto-filled)
                    </span>
                  </label>
                  <div style={{
                    padding: '10px 14px', border: '1.5px solid var(--sand-deeper)',
                    borderRadius: 10, fontSize: 14, background: 'var(--sand-warm)', color: 'var(--ink-soft)',
                  }}>
                    {ROLE_DEPT[form.role] ?? 'Floor'}
                  </div>
                </div>

                {/* Profile color */}
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Profile color
                  </label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        title={c.label}
                        onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                        style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: c.value, border: 'none',
                          cursor: 'pointer', padding: 0, flexShrink: 0,
                          boxShadow: form.color === c.value
                            ? `0 0 0 2px var(--sand), 0 0 0 4.5px ${c.value}`
                            : 'none',
                          transition: 'box-shadow 0.15s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Primary actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn-brand"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={modalMode === 'add' ? handleAdd : handleEdit}
            disabled={submitting}
                  >
                    {submitting ? 'Creating…' : (modalMode === 'add' ? 'Add to team' : 'Save changes')}
                  </button>
                  <button
                    onClick={closeModal}
                    style={{
                      padding: '11px 20px', borderRadius: 10,
                      border: '1.5px solid var(--sand-deeper)', background: 'white',
                      fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>

                {/* Remove button (edit only) */}
                {modalMode === 'edit' && (
                  <button
                    onClick={() => setShowRemoveConfirm(true)}
                    style={{
                      marginTop: 14, width: '100%', padding: '10px 0', borderRadius: 10,
                      border: '1.5px solid rgba(224,122,95,0.3)',
                      background: 'rgba(224,122,95,0.06)',
                      color: 'var(--coral-deep)', fontWeight: 600, cursor: 'pointer',
                      fontSize: 14, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <Trash2 size={13} /> Remove from team
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
