-- Fix: managers/admins could not read their property's roleplay_sessions.
--
-- The original "Managers and admins can read property sessions" policy compared
-- `users.id = auth.uid()`. But in this codebase `users.id` is an INTERNAL uuid
-- that is DISTINCT from the Supabase auth id — the auth id lives in
-- `users.auth_id`. So `id = auth.uid()` never matched, and the policy returned
-- zero rows for every manager. That silently zeroed out every roleplay-derived
-- metric on the manager dashboard (team health, the trend chart, skill gaps,
-- and the top-performer insight).
--
-- This mirrors the (correct) lesson_completions manager policy, which resolves
-- the caller's internal id through auth_id.

DROP POLICY IF EXISTS "Managers and admins can read property sessions" ON roleplay_sessions;

CREATE POLICY "Managers and admins can read property sessions" ON roleplay_sessions
  FOR SELECT USING (
    property_id IN (
      SELECT property_id FROM users
      WHERE auth_id = auth.uid() AND role IN ('manager', 'admin')
    )
  );
