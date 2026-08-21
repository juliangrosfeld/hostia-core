import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_PROPERTY_ID } from '@/lib/config';
import { CURRICULUM, resolveCurriculum, type Module } from '@/lib/curriculum';
import { activityDayIndex, computeStreak, dayIndexOf } from '@/lib/streak';
import { LIMITS, enforceRateLimit, userSubject } from '@/lib/rate-limit';
import {
  computeTotalXp, fullCompletionTimes, fullyDoneByModule,
  type CompletionPhaseRow, type SessionXpRow,
} from '@/lib/progress-model';

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
// NOTE: users.xp / users.streak_days are dead columns (never written). XP is
// COMPUTED from roleplay_sessions + lesson_completions below; streaks from
// lesson_completions + phase_completions (roleplay alone earns no streak day —
// see lib/streak.ts). Both use the same sources /api/staff/xp-streak does, so
// staff hero and roster always agree.
interface StaffRow { id: string; full_name: string | null; last_active: string | null; }
interface SessionRow extends SessionXpRow { staff_id: string; warmth_score: number; completed_at: string; }
interface CompletionRow extends CompletionPhaseRow { staff_id: string; completed_at: string; }

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

  // 1b. Rate limit — this is the most expensive read in the app (up to 10k
  // sessions + 20k completions per call), so cap how fast one account can
  // re-run it. Well above what the UI issues: one call per load plus refreshes.
  const limited = await enforceRateLimit(LIMITS.dashboardReadPerUser, userSubject(user.id));
  if (limited) return limited;

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

  // 4. Fetch in parallel. The per-staff activity tables — users,
  //    roleplay_sessions, lesson_completions and phase_completions — go through
  //    the authenticated client so RLS is the security boundary AND every query
  //    is also explicitly scoped to property_id (defense in depth). Only the
  //    non-sensitive catalog/config reads (properties.venue_type,
  //    property_modules, phases) use the admin client, mirroring /api/curriculum,
  //    because their RLS is closed to non-owners.
  const admin = createAdminClient();

  // Property track (venue_type → track 1:1) drives the phase set.
  const { data: prop } = await admin
    .from('properties')
    .select('venue_type')
    .eq('id', propertyId)
    .single();
  const track = (prop?.venue_type as string | null) ?? null;

  const [staffRes, sessionRes, completionRes, moduleRes, phasesRes, phaseCompletionRes] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, last_active')
      .eq('property_id', propertyId)
      .eq('role', 'staff'),
    supabase
      .from('roleplay_sessions')
      .select('staff_id, module_id, lesson_id, warmth_score, xp_earned, passed, completed_at')
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
    track
      ? admin
          .from('phases')
          .select('id, phase_number, title')
          .eq('track', track)
          .order('phase_number', { ascending: true })
      : Promise.resolve({ data: [] as { id: string; phase_number: number; title: string }[], error: null }),
    supabase
      .from('phase_completions')
      .select('staff_id, phase_id, completed_at')
      .eq('property_id', propertyId)
      .limit(20_000),
  ]);

  if (staffRes.error) console.error('[dashboard] staff query error:', staffRes.error);
  if (sessionRes.error) console.error('[dashboard] sessions query error:', sessionRes.error);
  if (completionRes.error) console.error('[dashboard] completions query error:', completionRes.error);
  if (moduleRes.error) console.error('[dashboard] property_modules query error:', moduleRes.error);

  const allStaff: StaffRow[] = staffRes.data ?? [];
  const modules: Module[] = resolveCurriculum(moduleRes.data);

  // This dashboard reports on STAFF only. The property-scoped activity queries
  // also return the manager's own learning rows (managers can browse modules
  // and earn personal XP/streak, shown by the /api/staff/* endpoints) — drop
  // them here, at the source, so no roster entry, KPI, average or insight can
  // ever mix manager activity into the staff pool.
  const staffIdSet = new Set(allStaff.map((s) => s.id));
  const allSessions: SessionRow[] = ((sessionRes.data ?? []) as SessionRow[])
    .filter((s) => staffIdSet.has(s.staff_id));
  const allCompletions: CompletionRow[] = ((completionRes.data ?? []) as CompletionRow[])
    .filter((c) => staffIdSet.has(c.staff_id));

  // ── XP ─────────────────────────────────────────────────────────────────────
  // Total XP per staff via the shared lib/progress-model.ts derivation
  // (roleplay XP + lesson XP on FULL completion + warmth bonus), identical to
  // /api/staff/xp-streak, so the roster can never disagree with the staff
  // hero. Computed once over the full data; phase-scoped views reuse it (XP
  // is per staff member and doesn't change with the phase filter).
  const sessionsByStaff = new Map<string, SessionRow[]>();
  for (const s of allSessions) {
    const list = sessionsByStaff.get(s.staff_id) ?? [];
    list.push(s);
    sessionsByStaff.set(s.staff_id, list);
  }
  const completionsByStaff = new Map<string, CompletionRow[]>();
  for (const c of allCompletions) {
    const list = completionsByStaff.get(c.staff_id) ?? [];
    list.push(c);
    completionsByStaff.set(c.staff_id, list);
  }
  const totalXpByStaff = new Map<string, number>();
  for (const s of allStaff) {
    const { totalXp } = computeTotalXp({
      sessions: sessionsByStaff.get(s.id) ?? [],
      completions: completionsByStaff.get(s.id) ?? [],
      modules,
    });
    totalXpByStaff.set(s.id, totalXp);
  }

  // ── Full completion per staff ──────────────────────────────────────────────
  // FULLY completed lessons per staff member (lib/progress-model.ts — every
  // phase the lesson has, apply = passed roleplay). This is the only lesson
  // count the roster and the weekly-lessons KPI may use.
  const fullyDoneByModuleByStaff = new Map<string, Map<string, Set<string>>>();
  for (const s of allStaff) {
    fullyDoneByModuleByStaff.set(s.id, fullyDoneByModule(completionsByStaff.get(s.id) ?? [], modules));
  }
  // WHEN each of those lessons was completed (shared lib/progress-model.ts
  // derivation) — feeds both the streaks below and the weekly-lessons KPI, so
  // the two can never disagree about which day a lesson was finished on.
  const completionTimesByStaff = new Map<string, number[]>();
  for (const s of allStaff) {
    completionTimesByStaff.set(s.id, fullCompletionTimes(completionsByStaff.get(s.id) ?? [], modules));
  }

  // ── Streaks ────────────────────────────────────────────────────────────────
  // Per-staff EARNED day-sets → streaks via the shared lib/streak.ts math
  // (identical rule and inputs to the staff hero, /api/staff/xp-streak): a day
  // is earned by a NEW lesson reaching full completion, or by a passed phase
  // exam. Roleplay activity on its own earns nothing, so allSessions is
  // deliberately NOT an input here. Built from the UNfiltered activity so a
  // phase filter never shortens a streak.
  const earnedDaysByStaff = new Map<string, Set<number>>();
  const addEarnedDay = (staffId: string, day: number) => {
    const set = earnedDaysByStaff.get(staffId) ?? new Set<number>();
    set.add(day);
    earnedDaysByStaff.set(staffId, set);
  };
  for (const [staffId, times] of completionTimesByStaff) {
    for (const t of times) addEarnedDay(staffId, dayIndexOf(t));
  }
  for (const pc of (phaseCompletionRes.data ?? []) as { staff_id: string; completed_at: string | null }[]) {
    if (pc.completed_at) addEarnedDay(pc.staff_id, activityDayIndex(pc.completed_at));
  }
  const streakOf = (staffId: string): number =>
    computeStreak(earnedDaysByStaff.get(staffId) ?? new Set<number>());

  // ── Phase placement ───────────────────────────────────────────────────────
  // A staff member's CURRENT phase = the lowest-numbered phase they haven't yet
  // completed (no row in phase_completions for it). With no completions everyone
  // sits on phase 1. Until the Stage-2 exam ships, that's every real staffer.
  const phaseList = (phasesRes.data ?? []) as { id: string; phase_number: number; title: string }[];
  const completedPhasesByStaff = new Map<string, Set<string>>();
  for (const pc of (phaseCompletionRes.data ?? []) as { staff_id: string; phase_id: string }[]) {
    const set = completedPhasesByStaff.get(pc.staff_id) ?? new Set<string>();
    set.add(pc.phase_id);
    completedPhasesByStaff.set(pc.staff_id, set);
  }
  const currentPhaseOf = (staffId: string): string | null => {
    const done = completedPhasesByStaff.get(staffId) ?? new Set<string>();
    for (const ph of phaseList) if (!done.has(ph.id)) return ph.id;
    return null; // all phases complete
  };
  const currentPhaseByStaff = new Map<string, string | null>();
  for (const s of allStaff) currentPhaseByStaff.set(s.id, currentPhaseOf(s.id));

  // Distribution is always computed over ALL staff (so the tiles show real totals
  // regardless of which phase is being filtered to).
  const phaseDistribution = phaseList.map((ph) => ({
    phase_id: ph.id,
    phase_number: ph.phase_number,
    title: ph.title,
    count: allStaff.filter((s) => currentPhaseByStaff.get(s.id) === ph.id).length,
  }));

  // Module→phase assignments (the same source /api/curriculum uses — CURRICULUM
  // carries no phase fields), needed to scope skill gaps per phase. Phase 1 also
  // owns the not-yet-categorized ("universal") modules with no assignment.
  const phaseOneId = phaseList[0]?.id;
  const modulePhaseById = new Map<string, string>();
  if (phaseList.length > 0) {
    const { data: mpaRows } = await admin
      .from('module_phase_assignments')
      .select('module_id, phase_id')
      .in('phase_id', phaseList.map((p) => p.id));
    for (const r of mpaRows ?? []) modulePhaseById.set(r.module_id, r.phase_id);
  }

  // ── Per-scope metrics ──────────────────────────────────────────────────────
  // All KPI/chart/insight math for one staff scope (all staff, or one phase's
  // staff). The data is already in memory, so computing every phase's block up
  // front is cheap — and it lets the client switch phase filters instantly,
  // with no refetch. Purely synchronous; every DB read happens above.
  function metricsFor(staff: StaffRow[], selectedPhase: string | null) {
  const staffIds = new Set(staff.map((s) => s.id));
  const sessions: SessionRow[] = allSessions.filter((s) => staffIds.has(s.staff_id));
  const completions: CompletionRow[] = allCompletions.filter((c) => staffIds.has(c.staff_id));

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
  const healthDelta = round(avg(warmth30) - avg(warmthPrev30));

  // ── 8–10. Lessons completed this week vs last week ─────────────────────────
  // A lesson counts as completed when its LAST required phase lands (full
  // completion — the same lib/progress-model.ts definition the staff view,
  // roster and streaks use), so a failed roleplay never books a "lesson" here.
  // completionTimesByStaff above is that derivation, shared with the streaks.
  let lessonsThisWeek = 0;
  let lessonsLastWeek = 0;
  for (const staffId of staffIds) {
    for (const completedAt of completionTimesByStaff.get(staffId) ?? []) {
      if (completedAt >= d7) lessonsThisWeek++;
      else if (completedAt >= d14) lessonsLastWeek++;
    }
  }
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
  // Only modules explicitly assigned to this property via property_modules count
  // as skills — never the resolveCurriculum() full-curriculum fallback. So a fine
  // dining venue doesn't get a "Casual Dining" bar it never assigned.
  const assignedModuleIds = new Set(
    (moduleRes.data ?? []).filter((m) => m.is_active).map((m) => m.module_id),
  );
  // When a phase is selected, skill gaps scope to that phase's modules (via the
  // hoisted module→phase map).
  const inSelectedPhase = (m: Module): boolean => {
    if (!selectedPhase) return true;
    const phaseId = modulePhaseById.get(m.id);
    if (phaseId) return phaseId === selectedPhase;
    return selectedPhase === phaseOneId;
  };
  const skillGaps = modules
    .filter((m) => assignedModuleIds.has(m.id))
    .filter(inSelectedPhase)
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

  // ── 15c. Top performer — most TOTAL XP (shared model), badges/streak/warmth ─
  const warmthByStaff = new Map<string, number[]>();
  for (const s of sessions) {
    if (!staffIds.has(s.staff_id)) continue;
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
  for (const s of staff) {
    const xp = totalXpByStaff.get(s.id) ?? 0;
    if (xp > topXp) { topXp = xp; topId = s.id; }
  }
  let topPerformer: {
    id: string; full_name: string; first_name: string; badges: number; streak: number; score: number;
  } | null = null;
  if (topId && topXp > 0) {
    const su = staff.find((s) => s.id === topId);
    if (su) {
      const w = warmthByStaff.get(topId) ?? [];
      topPerformer = {
        id: topId, // lets the client's "View {name}" CTA open the right roster profile
        full_name: su.full_name ?? '',
        first_name: firstName(su.full_name),
        badges: applyBadgesByStaff.get(topId) ?? 0,
        streak: streakOf(topId),
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

  return {
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
  };
  }

  // ── Roster — ALL staff, computed metrics, drill-in compatible shape ────────
  // Per-staff metrics are identical whatever phase filter is active (activity
  // is per staff member), so the roster is built once from the full data and
  // each entry carries currentPhaseId — the client filters it locally.
  // Lessons done = FULLY completed lessons (shared model, hoisted above) — the
  // same number the staff member's own module cards add up to.
  const lessonsDoneCountByStaff = new Map<string, number>();
  for (const [staffId, byModule] of fullyDoneByModuleByStaff) {
    let count = 0;
    for (const lessons of byModule.values()) count += lessons.size;
    lessonsDoneCountByStaff.set(staffId, count);
  }
  const sessionsCountByStaff = new Map<string, number>();
  const staffModuleWarmth = new Map<string, number[]>(); // key `${staffId}|${moduleId}`
  const warmthByStaff = new Map<string, number[]>();
  const applyBadgesByStaff = new Map<string, number>();
  for (const c of allCompletions) {
    if (c.phase === 'apply') applyBadgesByStaff.set(c.staff_id, (applyBadgesByStaff.get(c.staff_id) ?? 0) + 1);
  }
  for (const s of allSessions) {
    sessionsCountByStaff.set(s.staff_id, (sessionsCountByStaff.get(s.staff_id) ?? 0) + 1);
    const key = `${s.staff_id}|${s.module_id}`;
    const bucket = staffModuleWarmth.get(key) ?? [];
    bucket.push(s.warmth_score);
    staffModuleWarmth.set(key, bucket);
    const wBucket = warmthByStaff.get(s.staff_id) ?? [];
    wBucket.push(s.warmth_score);
    warmthByStaff.set(s.staff_id, wBucket);
  }

  const totalLessons = modules
    .filter((m) => m.id !== 'phase-1-certification')
    .reduce((sum, m) => sum + m.totalLessons, 0);

  const roster = allStaff
    .map((s) => {
      const lessonsDone = lessonsDoneCountByStaff.get(s.id) ?? 0;
      const sessionCount = sessionsCountByStaff.get(s.id) ?? 0;
      const myWarmth = warmthByStaff.get(s.id) ?? [];
      const score = myWarmth.length ? round(avg(myWarmth)) : 0;
      // Total XP (roleplay + lesson) — the same number the staff hero shows.
      const xp = totalXpByStaff.get(s.id) ?? 0;
      const active = Boolean(s.last_active) && ts(s.last_active) >= d7;
      // Any activity row counts as history (a partially-done lesson is not a
      // "new" staffer) — only the lessonsDone COUNT requires full completion.
      const hasHistory = (completionsByStaff.get(s.id)?.length ?? 0) > 0 || sessionCount > 0;

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
        currentPhaseId: currentPhaseByStaff.get(s.id) ?? null,
        name: s.full_name ?? 'Unnamed',
        initials: initialsFor(s.full_name),
        role: 'Team member',
        dept: 'Floor',
        level: Math.max(1, Math.floor(xp / 200) + 1),
        xp,
        streak: streakOf(s.id),
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

  // One metrics block per scope: 'all' plus every phase. The client picks a
  // block on tile click — no round trip.
  const byPhase: Record<string, ReturnType<typeof metricsFor>> = {
    all: metricsFor(allStaff, null),
  };
  for (const ph of phaseList) {
    byPhase[ph.id] = metricsFor(
      allStaff.filter((s) => currentPhaseByStaff.get(s.id) === ph.id),
      ph.id,
    );
  }

  return NextResponse.json({
    isDemo: false,
    byPhase,
    roster,
    phaseDistribution,
  });
}
