-- Roleplay sessions: one row per completed (passed or failed) Apply-phase roleplay.
-- XP is the progress signal; warmth_score is the performance signal. They are
-- separate but both sourced from the same roleplay session.
--
-- transcript stores an array of objects:
--   [{ role: 'user' | 'assistant', content: string, warmth?: number }]

CREATE TABLE roleplay_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  staff_id UUID NOT NULL REFERENCES users(id),
  lesson_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  scenario_variant TEXT,
  passed BOOLEAN NOT NULL,
  warmth_score INTEGER NOT NULL CHECK (warmth_score >= 0 AND warmth_score <= 100),
  xp_earned INTEGER NOT NULL,
  turns INTEGER NOT NULL,
  transcript JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE roleplay_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can insert own sessions" ON roleplay_sessions
  FOR INSERT WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Staff can read own sessions" ON roleplay_sessions
  FOR SELECT USING (staff_id = auth.uid());

CREATE POLICY "Managers and admins can read property sessions" ON roleplay_sessions
  FOR SELECT USING (
    property_id IN (
      SELECT property_id FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );
