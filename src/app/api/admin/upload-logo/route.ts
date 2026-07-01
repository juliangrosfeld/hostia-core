import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET = 'property-logos'
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
])

// POST — upload a property logo and return its public URL.
//
// Accepts multipart form data with a `file` and an optional `propertyId` (used
// only to namespace the storage path; the new-client form uploads before the
// property exists, so it's optional). Writes go through the service-role admin
// client into the public `property-logos` bucket. The caller is responsible for
// persisting the returned URL onto the property (POST /api/admin/properties or
// PATCH /api/admin/properties/[id]).
export async function POST(request: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 400 })
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type (use PNG, JPEG, WebP, or SVG)' },
      { status: 400 }
    )
  }

  const propertyId = form.get('propertyId')
  const folder = typeof propertyId === 'string' && propertyId.trim() ? propertyId.trim() : 'unassigned'
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const admin = createAdminClient()

  // Ensure the bucket exists (public) so uploads work even before the SQL
  // migration is applied. Idempotent — ignore "already exists".
  const { data: bucket } = await admin.storage.getBucket(BUCKET)
  if (!bucket) {
    const { error: createErr } = await admin.storage.createBucket(BUCKET, { public: true })
    if (createErr && !/exist/i.test(createErr.message)) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: uploadErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl, path })
}
