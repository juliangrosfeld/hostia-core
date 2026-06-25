import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_PROPERTY_ID } from '@/lib/config';
import { CURRICULUM, resolveCurriculum, type Module } from '@/lib/curriculum';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Constants ────────────────────────────────────────────────────────────────
const DAY = 86_400_000;
const CERT_LESSON_ID = 'phase-1-exam'; // the (future) Phase 1 cert exam lesson id
const CLOSE_TO_CERT_THRESHOLD = 24;    // Phase-1 completions before someone is "close"

// Phase 1 is every content module except the certification placeholder.
const PHASE_1_MODULE_IDS = new Set(
  CURRICULUM.filter((m) => m.id !== 'phase-1-certification').map((m) => m.id),
);

// Map a curriculum module id onto the StaffMember.skills key the drill-in view
// expects, so a real roster row can still open the staff profile cleanly.
const MODULE_TO_SKILL: Record<string, keyof StaffSkills> = {
  greetings: 'greetings',
  'service-flow': 'serviceFlow',
  language: 'language',
  complaints: 'complaints',
  'guest-psychology': 'guestPsychology',
  'casual-dining-floor': 'casualDiningFloor',
  'physical-craft': 'floor',
};

const AVATAR_COLORS = ['#F5A623', '#E07A5F', '#81B29A', '#D4A574', '#8DA9C4', '#4A5568'];

// ── Types (rows we actually select) ──────────────────────────────────────────
interface StaffSkills {
  greetings: number; serviceFlow: number; language: number; complaints: number;
  floor: number; guestPsychology: number; casualDiningFloor: number;
}
interface StaffRow { id: string; full_name: string | null; last_active: string | null; xp: number | null; streak_days: number | null; }
interface SessionRow { staff_id: string; module_id: string; warmth_score: number; xp_earned: number | null; passed: boolean; completed_at: string; }
interface CompletionRow { staff_id: string; module_id: string; lesson_id: string; phase: string; completed_at: string; }

// ── Helpers ──────────────────────────────────────────────────────────────────
const ts = (iso: string | null): number => (iso ? Date.parse(iso) : 0);
const avg = (nums: number[]): number => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
const round = (n: number): number => Math.round(n);

function firstName(name: string | null): string {
  return (name ?? '').trim().split(/\s+/)[0] || 'Someone';
}

function initialsFor(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - ts(iso);
  if (diff < 0) return 'Just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// "Ana, Diego and Robbie" — caps the visible names and appends "+N more".
function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  const shown = names.slice(0, 3);
  const extra = names.length - shown.length;
  let base: string;
  if (shown.length === 1) base = shown[0];
  else base = `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
  return extra > 0 ? `${base} +${extra} more` : base;
}

// ── Route ────────────────────────────────────────────────────────────────────
export async function GET() {
  const supabase = await createClient();

  // 1. Auth — must be a signed-in manager or admin.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('property_id, role')
    .eq('auth_id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }
  if (profile.role !== 'manager' && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const propertyId = profile.property_id as string | null;
  if (!propertyId) {
    return NextResponse.json({ error: 'No property associated with this account' }, { status: 400 });
  }

  // 2. Demo property → hand back the sentinel; the client keeps its mock UI.
  if (propertyId === DEMO_PROPERTY_ID) {
    return NextResponse.json({ isDemo: true });
  }

  // 3. Date boundaries.
  const now = Date.now();
  const d7 = now - 7 * DAY;
  const d14 = now - 14 * DAY;
  const d30 = now - 30 * DAY;
  const d60 = now - 60 * DAY;

  // 4. Fetch in parallel. users / roleplay_sessions / lesson_completions go
  //    through the authenticated client so RLS is the security boundary AND every
  //    query is also explicitly scoped to property_id (defense in depth). Only
  //    property_modules (non-sensitive config) is read with the admin client,
  //    mirroring /api/curriculum, because its RLS is closed to non-owners.
  const admin = createAdminClient();
  const [staffRes, sessionRes, completionRes, moduleRes] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, last_active, xp, streak_days')
      .eq('property_id', propertyId)
      .eq('role', 'staff'),
    supabase
      .from('roleplay_sessions')
      .select('staff_id, module_id, warmth_score, xp_earned, passed, completed_at')
      .eq('property_id', propertyId)
      .order('completed_at', { ascending: true })
      .limit(10_000),
    supabase
      .from('lesson_completions')
      .select('staff_id, module_id, lesson_id, phase, completed_at')
      .eq('property_id', propertyId)
      .limit(20_000),
    admin
      .from('property_modules')
      .select('module_id, order_index, is_active')
      .eq('property_id', propertyId)
      .order('order_index'),
  ]);

  if (staffRes.error) console.error('[dashboard] staff query error:', staffRes.error);
  if (sessionRes.error) console.error('[dashboard] sessions query error:', sessionRes.error);
  if (completionRes.error) console.error('[dashboard] completions query error:', completionRes.error);
  if (moduleRes.error) console.error('[dashboard] property_modules query error:', moduleRes.error);

  const staff: StaffRow[] = staffRes.data ?? [];
  const sessions: SessionRow[] = (sessionRes.data ?? []) as SessionRow[];
  const completions: CompletionRow[] = (completionRes.data ?? []) as CompletionRow[];
  const modules: Module[] = resolveCurriculum(moduleRes.data);

  const staffIds = new Set(staff.map((s) => s.id));

  // ── 1–4. Staff counts + active avatars ────────────────────────────────────
  const totalStaff = staff.length;
  const activeStaffRows = staff
    .filter((s) => s.last_active && ts(s.last_active) >= d7)
    .sort((a, b) => ts(b.last_active) - ts(a.last_active));
  const atRiskRows = staff.filter((s) => !s.last_active || ts(s.last_active) < d7);

  const activeStaff = activeStaffRows.length;
  const atRisk = atRiskRows.length;
  const activeAvatars = activeStaffRows.slice(0, 6).map((s) => ({
    initials: initialsFor(s.full_name),
    full_name: s.full_name ?? '',
    color: colorFor(s.id),
  }));

  // ── 5–7. Team health (warmth) — current vs previous 30 days ────────────────
  const warmth30 = sessions.filter((s) => ts(s.completed_at) >= d30).map((s) => s.warmth_score);
  const warmthPrev30 = sessions
    .filter((s) => ts(s.completed_at) >= d60 && ts(s.completed_at) < d30)
    .map((s) => s.warmth_score);
  const healthCurrent = round(avg(warmth30));
  const healthPrev = round(avg(warmthPrev30));
  const healthDelta = round(avg(warmth30) - avg(warmthPrev30));

  // ── 8–10. Lessons completed this week vs last week ─────────────────────────
  const lessonsThisWeek = completions.filter((c) => ts(c.completed_at) >= d7).length;
  const lessonsLastWeek = completions.filter(
    (c) => ts(c.completed_at) >= d14 && ts(c.completed_at) < d7,
  ).length;
  let deltaPercent: number | null;
  if (lessonsLastWeek === 0) deltaPercent = lessonsThisWeek > 0 ? null : 0;
  else deltaPercent = round(((lessonsThisWeek - lessonsLastWeek) / lessonsLastWeek) * 100);

  // ── 11–12. Certification ───────────────────────────────────────────────────
  const certifiedStaff = new Set(
    completions
      .filter((c) => c.lesson_id === CERT_LESSON_ID && c.phase === 'apply')
      .map((c) => c.staff_id),
  );
  const phase1CountByStaff = new Map<string, number>();
  for (const c of completions) {
    if (PHASE_1_MODULE_IDS.has(c.module_id)) {
      phase1CountByStaff.set(c.staff_id, (phase1CountByStaff.get(c.staff_id) ?? 0) + 1);
    }
  }
  let closeToCount = 0;
  for (const s of staff) {
    if (certifiedStaff.has(s.id)) continue;
    if ((phase1CountByStaff.get(s.id) ?? 0) >= CLOSE_TO_CERT_THRESHOLD) closeToCount++;
  }

  // ── 13. Trend chart — last 30 days, carry-forward ──────────────────────────
  const warmthByDay = new Map<string, number[]>();
  for (const s of sessions) {
    if (ts(s.completed_at) < d30) continue;
    const day = s.completed_at.slice(0, 10); // YYYY-MM-DD (UTC)
    const bucket = warmthByDay.get(day) ?? [];
    bucket.push(s.warmth_score);
    warmthByDay.set(day, bucket);
  }
  const trendChart: { date: string; score: number }[] = [];
  let carried = 0;
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * DAY).toISOString().slice(0, 10);
    const bucket = warmthByDay.get(date);
    if (bucket && bucket.length) carried = round(avg(bucket));
    trendChart.push({ date, score: carried });
  }

  // ── 14. Skill gaps — avg warmth per skill-bearing module, weakest first ────
  const warmthByModule = new Map<string, number[]>();
  for (const s of sessions) {
    const bucket = warmthByModule.get(s.module_id) ?? [];
    bucket.push(s.warmth_score);
    warmthByModule.set(s.module_id, bucket);
  }
  const skillGaps = modules
    // Only modules that actually contain a roleplay are "skills" — warmth only
    // ever comes from roleplay, so non-roleplay modules can't have a real score.
    .filter((m) => m.lessons.some((l) => Boolean(l.scenarioId)))
    .map((m) => {
      const bucket = warmthByModule.get(m.id);
      return {
        module_id: m.id,
        module_title: m.title,
        score: bucket && bucket.length ? round(avg(bucket)) : 0,
        color: m.color,
      };
    })
    .sort((a, b) => a.score - b.score);

  // ── 15c. Top performer — most roleplay XP, with badges/streak/avg warmth ───
  const xpByStaff = new Map<string, number>();
  const warmthByStaff = new Map<string, number[]>();
  for (const s of sessions) {
    if (!staffIds.has(s.staff_id)) continue;
    xpByStaff.set(s.staff_id, (xpByStaff.get(s.staff_id) ?? 0) + (s.xp_earned ?? 0));
    const bucket = warmthByStaff.get(s.staff_id) ?? [];
    bucket.push(s.warmth_score);
    warmthByStaff.set(s.staff_id, bucket);
  }
  const applyBadgesByStaff = new Map<string, number>();
  for (const c of completions) {
    if (c.phase === 'apply') applyBadgesByStaff.set(c.staff_id, (applyBadgesByStaff.get(c.staff_id) ?? 0) + 1);
  }
  let topId: string | null = null;
  let topXp = 0;
  for (const [sid, xp] of xpByStaff) {
    if (xp > topXp) { topXp = xp; topId = sid; }
  }
  let topPerformer: {
    full_name: string; first_name: string; badges: number; streak: number; score: number;
  } | null = null;
  if (topId && topXp > 0) {
    const su = staff.find((s) => s.id === topId);
    if (su) {
      const w = warmthByStaff.get(topId) ?? [];
      topPerformer = {
        full_name: su.full_name ?? '',
        first_name: firstName(su.full_name),
        badges: applyBadgesByStaff.get(topId) ?? 0,
        streak: su.streak_days ?? 0,
        score: w.length ? round(avg(w)) : 0,
      };
    }
  }

  // ── 15a/15b. Insight cards ─────────────────────────────────────────────────
  const weakest = skillGaps[0] ?? null;
  const weakestSkill = weakest
    ? {
        module_id: weakest.module_id,
        module_title: weakest.module_title,
        score: weakest.score,
        message:
          weakest.score > 0
            ? `Team averages ${weakest.score}% on ${weakest.module_title}. Consider making it this week's focus module.`
            : `No roleplay scores yet for ${weakest.module_title}. Encourage the team to start practicing it.`,
      }
    : null;

  const atRiskNames = atRiskRows.map((s) => firstName(s.full_name));
  const atRiskStaff = {
    count: atRisk,
    names: atRiskNames,
    message:
      atRisk === 0
        ? 'Everyone has been active this week — nice work keeping the team engaged.'
        : `${joinNames(atRiskNames)} ${atRisk === 1 ? "hasn't" : "haven't"} engaged in over a week. A nudge or quick 1:1 could re-engage them now.`,
  };

  // ── Roster — real staff, computed metrics, drill-in compatible shape ───────
  const lessonsDoneByStaff = new Map<string, Set<string>>();
  const sessionsCountByStaff = new Map<string, number>();
  const staffModuleWarmth = new Map<string, number[]>(); // key `${staffId}|${moduleId}`
  for (const c of completions) {
    const set = lessonsDoneByStaff.get(c.staff_id) ?? new Set<string>();
    set.add(c.lesson_id);
    lessonsDoneByStaff.set(c.staff_id, set);
  }
  for (const s of sessions) {
    sessionsCountByStaff.set(s.staff_id, (sessionsCountByStaff.get(s.staff_id) ?? 0) + 1);
    const key = `${s.staff_id}|${s.module_id}`;
    const bucket = staffModuleWarmth.get(key) ?? [];
    bucket.push(s.warmth_score);
    staffModuleWarmth.set(key, bucket);
  }

  const totalLessons = modules
    .filter((m) => m.id !== 'phase-1-certification')
    .reduce((sum, m) => sum + m.totalLessons, 0);

  const roster = staff
    .map((s) => {
      const lessonsDone = lessonsDoneByStaff.get(s.id)?.size ?? 0;
      const sessionCount = sessionsCountByStaff.get(s.id) ?? 0;
      const myWarmth = warmthByStaff.get(s.id) ?? [];
      const score = myWarmth.length ? round(avg(myWarmth)) : 0;
      const xp = s.xp ?? 0;
      const active = Boolean(s.last_active) && ts(s.last_active) >= d7;
      const hasHistory = lessonsDone > 0 || sessionCount > 0;

      let status: 'star' | 'active' | 'at-risk' | 'new';
      if (!hasHistory) status = 'new';
      else if (!active) status = 'at-risk';
      else if (score >= 85) status = 'star';
      else status = 'active';

      const skills: StaffSkills = {
        greetings: 0, serviceFlow: 0, language: 0, complaints: 0,
        floor: 0, guestPsychology: 0, casualDiningFloor: 0,
      };
      for (const [moduleId, skillKey] of Object.entries(MODULE_TO_SKILL)) {
        const bucket = staffModuleWarmth.get(`${s.id}|${moduleId}`);
        if (bucket && bucket.length) skills[skillKey] = round(avg(bucket));
      }

      return {
        id: s.id,
        name: s.full_name ?? 'Unnamed',
        initials: initialsFor(s.full_name),
        role: 'Team member',
        dept: 'Floor',
        level: Math.max(1, Math.floor(xp / 200) + 1),
        xp,
        streak: s.streak_days ?? 0,
        score,
        lessons: lessonsDone,
        total: totalLessons,
        lastActive: relativeTime(s.last_active),
        status,
        joined: '',
        color: colorFor(s.id),
        badges: applyBadgesByStaff.get(s.id) ?? 0,
        skills,
      };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({
    isDemo: false,
    totalStaff,
    activeStaff,
    atRisk,
    activeAvatars,
    teamHealth: { current: healthCurrent, delta: healthDelta },
    lessons: { thisWeek: lessonsThisWeek, deltaPercent },
    certified: { count: certifiedStaff.size, total: totalStaff, closeToCount },
    trendChart,
    skillGaps,
    insights: { weakestSkill, atRiskStaff, topPerformer },
    roster,
  });
}
