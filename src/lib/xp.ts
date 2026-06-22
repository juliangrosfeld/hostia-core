// ─── XP + WARMTH MODEL ───────────────────────────────────────
// XP = progress signal. Warmth score = performance signal. They are separate
// but both sourced from roleplay sessions.
//
// Roleplay lessons store a flat 50 XP base in curriculum.ts. The actual XP a
// staff member earns from a roleplay is calculated at runtime here, based on
// how warm their final performance was — but only if they passed.

export function calculateRoleplayXP(warmthScore: number, passed: boolean): number {
  if (!passed) return 0;
  if (warmthScore >= 85) return 75;
  if (warmthScore >= 70) return 60;
  return 50;
}

export function getWarmthLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Excellent', color: '#2D6A4F' };
  if (score >= 70) return { label: 'Good', color: '#74C69D' };
  if (score >= 55) return { label: 'Pass', color: '#F4A261' };
  return { label: 'Needs work', color: '#E76F51' };
}

export function getModuleSkillScore(
  sessions: { warmth_score: number; passed: boolean }[],
): number {
  const passed = sessions.filter((s) => s.passed);
  if (passed.length === 0) return 0;
  return Math.round(
    passed.reduce((sum, s) => sum + s.warmth_score, 0) / passed.length,
  );
}
