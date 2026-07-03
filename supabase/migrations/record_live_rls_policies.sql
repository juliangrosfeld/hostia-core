-- Record of live-only RLS state, dumped from pg_policies on 2026-07-03.
--
-- The tables below (users, properties, modules, property_modules,
-- certifications, lesson_progress) and the storage 'menus' policies were
-- configured directly in the Supabase dashboard and had no migration in this
-- repo. This file transcribes the live policies verbatim (formatting
-- normalized; semantics identical to the pg_policies dump) so the repo is the
-- full record of RLS. Running it against the live DB is a no-op apart from
-- DROP/CREATE churn — every statement recreates what is already there.
--
-- NOT covered here (still live-only): the CREATE TABLE DDL for these six
-- tables. This migration records policies only.

-- ---------------------------------------------------------------------------
-- get_my_property_id()
--
-- Used by users_manager_read_property below. A plain subquery on users inside
-- a users policy would recurse, so live this is a SECURITY DEFINER function
-- (it must be, or the policy would error with "infinite recursion detected").
-- Its body is not included in pg_policies; the definition below is the
-- canonical reconstruction. Before running this file against the live DB,
-- verify it matches:
--
--   SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_my_property_id';
CREATE OR REPLACE FUNCTION get_my_property_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT property_id FROM users WHERE auth_id = auth.uid() LIMIT 1
$$;

-- ---------------------------------------------------------------------------
-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_read_own ON users;
CREATE POLICY users_read_own ON users
  FOR SELECT USING (auth_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth_id = (SELECT auth.uid()));

-- NOTE: despite the name, this has no role check — every user in a property
-- can read every other user's row in that property. See AUDIT.md follow-ups.
DROP POLICY IF EXISTS users_manager_read_property ON users;
CREATE POLICY users_manager_read_property ON users
  FOR SELECT USING (property_id = get_my_property_id());

-- ---------------------------------------------------------------------------
-- properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS properties_read_own ON properties;
CREATE POLICY properties_read_own ON properties
  FOR SELECT USING (
    id = (SELECT property_id FROM users WHERE auth_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- modules
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read modules" ON modules;
CREATE POLICY "Authenticated users can read modules" ON modules
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full access to modules" ON modules;
CREATE POLICY "Service role full access to modules" ON modules
  FOR ALL TO service_role USING (true);

-- ---------------------------------------------------------------------------
-- property_modules
ALTER TABLE property_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their property modules" ON property_modules;
CREATE POLICY "Users can read their property modules" ON property_modules
  FOR SELECT TO authenticated USING (
    property_id = (SELECT property_id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role full access to property_modules" ON property_modules;
CREATE POLICY "Service role full access to property_modules" ON property_modules
  FOR ALL TO service_role USING (true);

-- ---------------------------------------------------------------------------
-- certifications
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS certs_read_own ON certifications;
CREATE POLICY certs_read_own ON certifications
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS certs_manager_read_property ON certifications;
CREATE POLICY certs_manager_read_property ON certifications
  FOR SELECT USING (
    property_id = (
      SELECT property_id FROM users
      WHERE auth_id = auth.uid() AND role IN ('manager', 'admin')
      LIMIT 1
    )
  );

-- ---------------------------------------------------------------------------
-- lesson_progress
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lp_read_own ON lesson_progress;
CREATE POLICY lp_read_own ON lesson_progress
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS lp_write_own ON lesson_progress;
CREATE POLICY lp_write_own ON lesson_progress
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS lp_update_own ON lesson_progress;
CREATE POLICY lp_update_own ON lesson_progress
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS lp_manager_read_property ON lesson_progress;
CREATE POLICY lp_manager_read_property ON lesson_progress
  FOR SELECT USING (
    property_id = (
      SELECT property_id FROM users
      WHERE auth_id = auth.uid() AND role IN ('manager', 'admin')
      LIMIT 1
    )
  );

-- ---------------------------------------------------------------------------
-- storage: 'menus' bucket
--
-- No app code references this bucket (checked 2026-07-03) — these policies are
-- vestigial but live, so they are recorded here. Note the read policy is
-- bucket-wide: any authenticated user can read any property's objects. If the
-- bucket ever gets used for per-property content, scope the read first.

DROP POLICY IF EXISTS "Authenticated users can read menus" ON storage.objects;
CREATE POLICY "Authenticated users can read menus" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'menus');

DROP POLICY IF EXISTS "Service role can upload menus" ON storage.objects;
CREATE POLICY "Service role can upload menus" ON storage.objects
  FOR INSERT TO service_role WITH CHECK (bucket_id = 'menus');
