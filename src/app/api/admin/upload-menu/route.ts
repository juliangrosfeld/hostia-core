import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET = 'property-menus'
// Menus are heavier than logos — scanned PDFs routinely run several MB.
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

// SVG is deliberately excluded — it can carry scripts, and the bucket serves
// files verbatim. PDF plus raster image formats only.
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
])

const EXT_BY_TYPE: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The content-type header is client-asserted; the file's leading bytes are the
// authority on what it actually is.
function sniffMenuType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d // %PDF-
  ) {
    return 'application/pdf'
  }
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // WEBP
  ) {
    return 'image/webp'
  }
  return null
}

// POST — upload a property menu (PDF or image) and return its public URL.
//
// Mirrors /api/admin/upload-logo: multipart form data with a `file` and an
// optional `propertyId` (used only to namespace the storage path; the
// new-client form uploads before the property exists, so it's optional).
// Writes go through the service-role admin client into the public
// `property-menus` bucket. The caller is responsible for persisting the
// returned URL onto the property (POST /api/admin/properties or
// PATCH /api/admin/properties/[id] as menu_pdf_url).
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
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type (use PDF, PNG, JPEG, or WebP)' },
      { status: 400 }
    )
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const sniffedType = sniffMenuType(bytes)
  if (sniffedType !== file.type) {
    return NextResponse.json(
      { error: 'File content does not match its declared type' },
      { status: 400 }
    )
  }

  const propertyId = form.get('propertyId')
  let folder = 'unassigned'
  if (typeof propertyId === 'string' && propertyId.trim()) {
    if (!UUID_RE.test(propertyId.trim())) {
      return NextResponse.json({ error: 'Invalid propertyId' }, { status: 400 })
    }
    folder = propertyId.trim().toLowerCase()
  }

  // Extension follows the verified MIME type — the client's filename is never
  // trusted for anything.
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT_BY_TYPE[file.type]}`

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

  const { error: uploadErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl, path })
}
