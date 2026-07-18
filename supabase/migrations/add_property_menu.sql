-- Per-property menu document (PDF or image), uploaded by GLAD AI in the admin
-- panel and shown to staff inside the "Our Menu" onboarding lesson — the
-- staff-side viewer (SectionMenuPdf in LearnPhase) already reads
-- properties.menu_pdf_url and renders a placeholder while it is NULL.
-- Idempotent — on the live DB this column may already exist.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS menu_pdf_url text;

-- Public storage bucket for uploaded menus, mirroring property-logos. Public
-- read so the staff lesson's <iframe>/download link works without a signed
-- URL; writes only ever go through the service-role admin client in
-- /api/admin/upload-menu.
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-menus', 'property-menus', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read policy for objects in the bucket. No INSERT/UPDATE/DELETE policy
-- is defined: uploads bypass RLS via the service role, and nothing else may
-- write here from the browser.
DROP POLICY IF EXISTS "Public read property-menus" ON storage.objects;
CREATE POLICY "Public read property-menus" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-menus');
