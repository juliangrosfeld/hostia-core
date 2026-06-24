-- GLAD AI admin panel — property-level overrides + venue type.
--
-- property_overrides stores per-client key/value configuration (e.g. the AI
-- roleplay scenario_context, display property_name, manager_name). RLS is fully
-- closed: every read/write goes through the service-role admin client in API
-- routes, never directly from the browser.

-- The new-client form lets GLAD AI pick a venue type, so the properties table
-- needs a column to hold it. Added idempotently so existing rows are unaffected.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS venue_type text;

CREATE TABLE IF NOT EXISTS property_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, key)
);

CREATE INDEX IF NOT EXISTS idx_property_overrides_property_id ON property_overrides(property_id);

ALTER TABLE property_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only" ON property_overrides
  USING (false) WITH CHECK (false);
