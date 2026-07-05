// Pass/fail + score model for Apply-phase roleplays — the SINGLE source of
// truth, shared by the client (live turn-by-turn UX in ApplyPhase) and the
// server (/api/roleplay-sessions), so the "You passed!" screen and the stored
// record can never drift apart.
//
// Warmth from the roleplay API is 1-10 per turn; the performance model works
// on a 0-100 warmth score (warmth × 10). To pass, the warmth score must stay
// at PASS_WARMTH_SCORE+ for CONSECUTIVE_PASSES_REQUIRED turns in a row, and
// the session must run at least MIN_TURNS turns. A session that reaches
// MAX_TURNS without passing has failed.

export const MAX_TURNS = 7;
export const MIN_TURNS = 3;
export const PASS_WARMTH_SCORE = 55;
export const CONSECUTIVE_PASSES_REQUIRED = 2;

// Grade a complete session from its per-turn warmth history (1-10 each).
//  • passed      — the pass condition above was met at some turn.
//  • warmthScore — the stored performance signal: session AVERAGE × 10.
export function gradeRoleplay(warmthHistory: number[]): {
  passed: boolean;
  warmthScore: number;
} {
  let consecutiveGood = 0;
  let passed = false;
  for (let i = 0; i < warmthHistory.length; i++) {
    consecutiveGood = warmthHistory[i] * 10 >= PASS_WARMTH_SCORE ? consecutiveGood + 1 : 0;
    if (i + 1 >= MIN_TURNS && consecutiveGood >= CONSECUTIVE_PASSES_REQUIRED) passed = true;
  }
  const avg = warmthHistory.length
    ? warmthHistory.reduce((a, b) => a + b, 0) / warmthHistory.length
    : 0;
  return { passed, warmthScore: Math.round(avg * 10) };
}
