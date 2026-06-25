-- lesson_completions: one row per (staff, lesson, phase) the staff member has
-- finished. This is the progress signal that powers the manager dashboard's
-- real metrics. It is SEPARATE from roleplay_sessions: roleplay_sessions stores
-- the warmth score + transcript for an Apply roleplay, while lesson_completions
-- just records "this staff finished this phase". A passed Apply phase writes to
-- BOTH tables.
--
-- The UNIQUE(staff_id, lesson_id, phase) constraint makes completions
-- idempotent — repeating the same phase never double-counts.
--
-- NOTE ON staff_id / auth.uid():
-- In this codebase `users.id` is an internal UUID that is DISTINCT from the
-- Supabase auth id. The auth id (auth.uid()) is stored in `users.auth_id`, and
-- every lookup in the app resolves a profile via `users.auth_id = auth.uid()`.
-- staff_id here references users(id) (matching roleplay_sessions.staff_id, which
-- the backfill below copies verbatim), so the RLS policies resolve the caller's
-- internal id through auth_id rather than comparing staff_id = auth.uid()
-- directly (which would never match and would fail the users(id) foreign key).

CREATE TABLE IF NOT EXISTS lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  lesson_id text NOT NULL,
  phase text NOT NULL CHECK (phase IN ('learn', 'practice', 'apply')),
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, lesson_id, phase)
);

CREATE INDEX IF NOT EXISTS idx_lesson_completions_property ON lesson_completions(property_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_staff ON lesson_completions(staff_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_completed_at ON lesson_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_property_completed ON lesson_completions(property_id, completed_at DESC);

ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

-- Staff may insert completions only for their own profile row.
CREATE POLICY "Staff can insert their own completions" ON lesson_completions
  FOR INSERT WITH CHECK (
    staff_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Staff may read their own completions.
CREATE POLICY "Staff can read their own completions" ON lesson_completions
  FOR SELECT USING (
    staff_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Managers and admins may read every completion for their property.
CREATE POLICY "Managers and admins can read property completions" ON lesson_completions
  FOR SELECT USING (
    property_id IN (
      SELECT property_id FROM users
      WHERE auth_id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- ── One-time backfill ────────────────────────────────────────────────────────
-- Any already-passed roleplay needs a matching 'apply' completion so existing
-- progress is reflected in the new system. staff_id/property_id are copied
-- straight from roleplay_sessions (both reference users(id)/properties(id)).
INSERT INTO lesson_completions (staff_id, property_id, module_id, lesson_id, phase, completed_at)
SELECT staff_id, property_id, module_id, lesson_id, 'apply', MIN(completed_at)
FROM roleplay_sessions
WHERE passed = true
GROUP BY staff_id, property_id, module_id, lesson_id
ON CONFLICT (staff_id, lesson_id, phase) DO NOTHING;
