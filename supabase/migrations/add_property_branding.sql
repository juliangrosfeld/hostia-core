-- Per-property branding: brand color + logo, backed by a public storage bucket.
--
-- The brand color reuses the existing properties.primary_color column (already
-- edited via the admin color pickers) rather than introducing a second color
-- field. logo_url holds the public URL of an uploaded logo. Both statements are
-- idempotent — on the live DB these columns may already exist.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#051956';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS logo_url text;

-- Public storage bucket for uploaded property logos. Public read so <img> tags
-- can load the logo without a signed URL; writes only ever go through the
-- service-role admin client in /api/admin/upload-logo.
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-logos', 'property-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read policy for objects in the bucket. No INSERT/UPDATE/DELETE policy
-- is defined: uploads bypass RLS via the service role, and nothing else may
-- write here from the browser.
DROP POLICY IF EXISTS "Public read property-logos" ON storage.objects;
CREATE POLICY "Public read property-logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-logos');
