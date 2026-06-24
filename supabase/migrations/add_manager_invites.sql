-- Manager invite flow — GLAD AI admin creates the first manager account for a
-- client property. The manager accepts via a tokenised link, sets a password,
-- and from then on logs in normally and onboards their own staff.
--
-- RLS is fully closed: every read/write goes through the service-role admin
-- client in API routes (the admin panel and the public accept-invite route),
-- never directly from the browser.

CREATE TABLE IF NOT EXISTS manager_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  invite_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_manager_invites_token ON manager_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_manager_invites_property ON manager_invites(property_id);
CREATE INDEX IF NOT EXISTS idx_manager_invites_email ON manager_invites(email);

ALTER TABLE manager_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only" ON manager_invites
  USING (false) WITH CHECK (false);
