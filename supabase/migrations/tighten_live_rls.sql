-- Tighten live RLS — follow-ups from the 2026-07-03 pg_policies review.
-- Ordered by severity; each section is independent, so it can be run
-- top-to-bottom or piecemeal in the Supabase dashboard SQL editor.
-- After running, re-dump pg_policies to confirm and diff against
-- record_live_rls_policies.sql.

-- ---------------------------------------------------------------------------
-- 1. HIGH: users_update_own allowed self-service privilege escalation.
--
-- The policy had no WITH CHECK, so USING (auth_id = auth.uid()) doubled as
-- the new-row check — it pinned auth_id and nothing else. Any user could run
-- `UPDATE users SET role='admin' WHERE auth_id = auth.uid()` against
-- PostgREST with the public anon key, and requireAdmin trusts users.role.
--
-- No app code performs a session-bound UPDATE on users (verified 2026-07-03:
-- the only self-write is /api/heartbeat's last_active bump, which uses the
-- service-role client precisely so it doesn't depend on this policy). So the
-- fix is total: drop the policy and revoke the grant. Service role is
-- unaffected (bypasses RLS, keeps its own grants). If a legitimate
-- self-edit feature ever lands, re-grant a column list instead:
--   GRANT UPDATE (full_name) ON users TO authenticated;
-- plus a policy with an explicit WITH CHECK.

DROP POLICY IF EXISTS users_update_own ON users;
REVOKE UPDATE ON users FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. MED: completion INSERTs didn't pin property_id.
--
-- WITH CHECK only constrained staff_id, so staff could insert rows tagged
-- with another property's property_id — and since every manager-read policy
-- filters by property_id, the forged row would surface in that other
-- property's dashboards. Pin property_id to the caller's own property.
--
-- Safe for all current writers: /api/lesson-completions and
-- /api/roleplay-sessions both insert with the session client using
-- property_id read from the caller's own users row, and nothing inserts
-- into phase_completions yet.

DROP POLICY IF EXISTS "Staff can insert their own completions" ON lesson_completions;
CREATE POLICY "Staff can insert their own completions" ON lesson_completions
  FOR INSERT WITH CHECK (
    staff_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND property_id = (SELECT property_id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Staff can insert own phase completions" ON phase_completions;
CREATE POLICY "Staff can insert own phase completions" ON phase_completions
  FOR INSERT WITH CHECK (
    staff_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND property_id = (SELECT property_id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Staff can insert own sessions" ON roleplay_sessions;
CREATE POLICY "Staff can insert own sessions" ON roleplay_sessions
  FOR INSERT WITH CHECK (
    staff_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND property_id = (SELECT property_id FROM users WHERE auth_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3. LOW: users_manager_read_property had no role check.
--
-- Despite the name, plain staff could read every colleague's users row in
-- their property. Like get_my_property_id(), the role lookup must go through
-- a SECURITY DEFINER function — a plain subquery on users inside a users
-- policy recurses.
--
-- Safe for the one consumer: /api/manager/dashboard reads staff rows with
-- the session client but 403s non-managers before that query; no staff-facing
-- code reads colleagues' rows.

CREATE OR REPLACE FUNCTION get_my_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE auth_id = auth.uid() LIMIT 1
$$;

DROP POLICY IF EXISTS users_manager_read_property ON users;
CREATE POLICY users_manager_read_property ON users
  FOR SELECT USING (
    property_id = get_my_property_id()
    AND get_my_role() IN ('manager', 'admin')
  );

-- ---------------------------------------------------------------------------
-- 4. LOW: phases and module_phase_assignments were readable by anon.
--
-- Both were USING (true) on the public role (see add_phases_architecture.sql
-- and add_module_phase_assignments.sql — this supersedes those policies), so
-- unauthenticated requests with the anon key could enumerate the curriculum
-- structure. Same content, authenticated only.

DROP POLICY IF EXISTS "Everyone can read phases" ON phases;
CREATE POLICY "Everyone can read phases" ON phases
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Everyone can read module phase assignments" ON module_phase_assignments;
CREATE POLICY "Everyone can read module phase assignments" ON module_phase_assignments
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 5. OPTIONAL (leave commented unless decided): drop the vestigial 'menus'
-- bucket policies. No app code references the bucket; the read policy is
-- bucket-wide across properties. Harmless while unused, but dead surface.
--
-- DROP POLICY IF EXISTS "Authenticated users can read menus" ON storage.objects;
-- DROP POLICY IF EXISTS "Service role can upload menus" ON storage.objects;
