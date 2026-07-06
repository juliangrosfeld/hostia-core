// ─── PROGRESS + XP MODEL — single source of truth ────────────────────────────
//
// Every reader of "how much XP does this person have" and "which module are
// they on" derives it through this file: /api/staff/xp-streak (staff hero),
// /api/manager/dashboard (roster + top performer), /api/curriculum and
// /api/staff/home-progress (module cards + hero Continue CTA). No route may
// re-implement these derivations — that is exactly how the hero, the module
// grid and the manager dashboard drifted apart before.
//
// TOTAL XP = roleplay XP + lesson XP.
//  • Roleplay XP: SUM(roleplay_sessions.xp_earned) over PASSED sessions.
//    xp_earned is computed server-side at session insert (lib/xp.ts).
//  • Lesson XP: awarded once per DISTINCT (module, lesson) the staff member
//    has FULLY completed — a lesson_completions row for every phase the
//    lesson actually has: learn + practice always, apply only when the lesson
//    carries a roleplay (scenarioId). Touching one phase earns nothing.
//    Fully-completed roleplay lessons also earn a warmth bonus on top of the
//    base amount (lessonWarmthBonus below) from the staff member's BEST
//    passed roleplay for that lesson — the same 70/85 tiers lib/xp.ts uses
//    for session XP. Amounts are resolved HERE from the curriculum catalog
//    (lesson.xp), never stored and never client-sent, so the award is
//    idempotent by construction and pre-existing completions earn it
//    retroactively.
//
// COMPLETION has exactly ONE definition, everywhere: a lesson is complete only
// when EVERY phase it actually has is done — learn + practice always, apply
// only when the lesson carries a roleplay (scenarioId). The apply row is
// written exclusively on a PASSED roleplay, so a failed roleplay never
// completes a lesson; the staff member retries the roleplay to finish it.
// Progress (module %, checkmarks, locking, current module) and XP both derive
// from this rule — the old "any phase row counts" progress shortcut let a
// failed roleplay show a lesson as complete and is gone.
//
// CURRENT MODULE ("Continue: …") = the first not-yet-complete content module
// in DISPLAY ORDER — the same phase-aware, order_in_phase ordering the staff
// home grid renders — never the property_modules order_index walk that used
// to send the CTA to a different module than the grid showed. With the grid's
// sequential locking, the first incomplete module in display order is always
// the first unlocked one.

import type { Module, Phase } from '@/lib/curriculum';

export interface SessionXpRow {
  module_id: string;
  lesson_id: string;
  warmth_score: number | null;
  xp_earned: number | null;
  passed: boolean;
}
// Every completion reader needs the phase — full completion (every phase the
// lesson has) is the single app-wide definition for progress AND XP.
export interface CompletionKeyRow {
  module_id: string;
  lesson_id: string;
}
export interface CompletionPhaseRow extends CompletionKeyRow {
  phase: string;
}
export interface ModulePhaseRow {
  module_id: string;
  phase_id: string;
  order_in_phase: number | null;
}

// The certification placeholder is never a content module: no lessons, never
// "current", carries no lesson XP.
const CERT_MODULE_ID = 'phase-1-certification';

const lessonKey = (moduleId: string, lessonId: string) => `${moduleId}::${lessonId}`;

// Warmth bonus on a fully-completed roleplay lesson, from the staff member's
// best PASSED roleplay for that lesson. Percentage tiers mirror lib/xp.ts's
// session multipliers (50→60→75 = +20% / +50%) so the bonus scales with the
// lesson's own worth instead of overpaying low-XP lessons.
export function lessonWarmthBonus(baseXp: number, bestWarmth: number): number {
  if (bestWarmth >= 85) return Math.round(baseXp * 0.5);
  if (bestWarmth >= 70) return Math.round(baseXp * 0.2);
  return 0;
}

// The phases a lesson requires: learn + practice always, apply only when the
// lesson has a roleplay. The apply row is only ever written on a PASSED
// roleplay, so requiring it makes "complete" mean "roleplay passed".
function hasRequiredPhases(done: Set<string> | undefined, hasApply: boolean): boolean {
  if (!done?.has('learn') || !done.has('practice')) return false;
  return !hasApply || done.has('apply');
}

// Phases done per lesson key, from raw completion rows.
function phasesDoneByLesson(completions: CompletionPhaseRow[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const c of completions) {
    const key = lessonKey(c.module_id, c.lesson_id);
    const set = map.get(key) ?? new Set<string>();
    set.add(c.phase);
    map.set(key, set);
  }
  return map;
}

// FULLY completed lesson ids per module — the app-wide completion definition.
// Walks the catalog (not the completion rows) so orphaned completions for
// removed lessons never count, and each lesson's required phases are
// authoritative.
export function fullyDoneByModule(
  completions: CompletionPhaseRow[],
  modules: Module[],
): Map<string, Set<string>> {
  const phasesDone = phasesDoneByLesson(completions);
  const done = new Map<string, Set<string>>();
  for (const m of modules) {
    if (m.id === CERT_MODULE_ID) continue;
    for (const l of m.lessons) {
      if (!hasRequiredPhases(phasesDone.get(lessonKey(m.id, l.id)), Boolean(l.scenarioId))) continue;
      const set = done.get(m.id) ?? new Set<string>();
      set.add(l.id);
      done.set(m.id, set);
    }
  }
  return done;
}

// Total XP for one staff member. `modules` must be the property's resolved
// curriculum so lesson XP amounts (and each lesson's required phases) come
// from the catalog, server-side. Lesson XP pays out only on FULL completion —
// every phase the lesson has — plus the warmth bonus for roleplay lessons.
export function computeTotalXp(input: {
  sessions: SessionXpRow[];
  completions: CompletionPhaseRow[];
  modules: Module[];
}): { totalXp: number; roleplayXp: number; lessonXp: number } {
  const roleplayXp = input.sessions.reduce(
    (sum, s) => sum + (s.passed ? (s.xp_earned ?? 0) : 0),
    0,
  );

  // Phases done + best passed warmth, per lesson.
  const phasesDone = phasesDoneByLesson(input.completions);
  const bestWarmth = new Map<string, number>();
  for (const s of input.sessions) {
    if (!s.passed || s.warmth_score === null) continue;
    const key = lessonKey(s.module_id, s.lesson_id);
    if (s.warmth_score > (bestWarmth.get(key) ?? -1)) bestWarmth.set(key, s.warmth_score);
  }

  // Walk the catalog (not the completion rows) so orphaned completions for
  // removed lessons can never pay out, and required phases are authoritative.
  let lessonXp = 0;
  for (const m of input.modules) {
    if (m.id === CERT_MODULE_ID) continue;
    for (const l of m.lessons) {
      const key = lessonKey(m.id, l.id);
      const hasApply = Boolean(l.scenarioId);
      if (!hasRequiredPhases(phasesDone.get(key), hasApply)) continue;
      lessonXp += l.xp;
      if (hasApply) lessonXp += lessonWarmthBonus(l.xp, bestWarmth.get(key) ?? 0);
    }
  }

  return { totalXp: roleplayXp + lessonXp, roleplayXp, lessonXp };
}

export function completedCount(m: Module, doneByModule: Map<string, Set<string>>): number {
  // Capped: a completion row for a lesson later removed from the module must
  // never produce 5/4.
  return Math.min(m.totalLessons, doneByModule.get(m.id)?.size ?? 0);
}

export function isModuleComplete(m: Module, doneByModule: Map<string, Set<string>>): boolean {
  return m.totalLessons > 0 && completedCount(m, doneByModule) >= m.totalLessons;
}

// ── Display order + current module ───────────────────────────────────────────

export interface CurrentModule {
  module: Module;
  done: number;
  percent: number;
}

// The modules of the staff member's CURRENT phase, in the exact order the
// staff home grid renders them: current phase = lowest phase without a
// phase_completions row; its modules sorted by order_in_phase, with the
// not-yet-categorized (unassigned) modules folded into phase 1. Properties
// with no phase configuration fall back to the resolveCurriculum order
// (property_modules.order_index) — which is also what the client renders in
// that case, so CTA and grid still agree.
export function orderedCurrentPhaseModules(input: {
  modules: Module[]; // resolved curriculum, in property_modules order
  phases: Phase[]; // this track's phases, phase_number ASC
  assignments: ModulePhaseRow[]; // module→phase for this track only
  completedPhaseIds: string[];
}): Module[] {
  const { modules, phases, assignments, completedPhaseIds } = input;
  const content = modules.filter((m) => m.id !== CERT_MODULE_ID && m.totalLessons > 0);

  if (phases.length === 0) return content;

  const meta = new Map(assignments.map((r) => [r.module_id, r]));
  const completed = new Set(completedPhaseIds);
  const currentPhase = phases.find((p) => !completed.has(p.id)) ?? null;
  // Every phase certified → nothing is "current"; callers get the whole list
  // and deriveCurrentModule returns null (all complete).
  if (!currentPhase) return content;

  const isPhaseOne = currentPhase.phase_number === phases[0]?.phase_number;
  const inCurrent = content.filter((m) => {
    const phaseId = meta.get(m.id)?.phase_id;
    if (phaseId) return phaseId === currentPhase.id;
    return isPhaseOne; // unassigned modules surface under phase 1
  });
  return inCurrent.sort(
    (a, b) => (meta.get(a.id)?.order_in_phase ?? 999) - (meta.get(b.id)?.order_in_phase ?? 999),
  );
}

// First not-complete module in display order (with sequential locking that is
// exactly the first unlocked incomplete one). Null when everything in the
// list is complete.
export function deriveCurrentModule(
  ordered: Module[],
  doneByModule: Map<string, Set<string>>,
): CurrentModule | null {
  const current = ordered.find((m) => !isModuleComplete(m, doneByModule));
  if (!current) return null;
  const done = completedCount(current, doneByModule);
  return {
    module: current,
    done,
    percent:
      current.totalLessons > 0
        ? Math.min(100, Math.round((done / current.totalLessons) * 100))
        : 0,
  };
}
