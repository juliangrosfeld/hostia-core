-- Fix: staff could never insert (or read) their OWN roleplay_sessions rows.
--
-- Same root cause as fix_roleplay_sessions_manager_rls.sql: in this codebase
-- `users.id` is an INTERNAL uuid distinct from the Supabase auth id, which
-- lives in `users.auth_id`. The original staff policies compared
-- `staff_id = auth.uid()` — staff_id references users(id), so the check never
-- matched. That earlier migration fixed only the manager SELECT policy; the
-- staff INSERT and staff SELECT policies kept the broken pattern.
--
-- Until now this was invisible because nothing inserted into roleplay_sessions
-- at all (/api/staff/xp-streak works around the broken self-read with the
-- service-role client). The new /api/roleplay-sessions route inserts with the
-- session-bound client so RLS is the ownership boundary — these policies must
-- resolve the caller's internal id through auth_id, mirroring the (correct)
-- lesson_completions policies.

DROP POLICY IF EXISTS "Staff can insert own sessions" ON roleplay_sessions;

CREATE POLICY "Staff can insert own sessions" ON roleplay_sessions
  FOR INSERT WITH CHECK (
    staff_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Staff can read own sessions" ON roleplay_sessions;

CREATE POLICY "Staff can read own sessions" ON roleplay_sessions
  FOR SELECT USING (
    staff_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
