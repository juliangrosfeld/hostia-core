import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Property columns the admin panel is allowed to edit inline.
const EDITABLE_FIELDS = ['name', 'venue_type', 'primary_color'] as const

// GET — a single property plus its module assignments and overrides.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { id } = await params
  const admin = createAdminClient()

  const { data: property, error } = await admin
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  const { data: propertyModules } = await admin
    .from('property_modules')
    .select('*')
    .eq('property_id', id)
    .order('order_index')

  const { data: propertyOverrides } = await admin
    .from('property_overrides')
    .select('*')
    .eq('property_id', id)

  return NextResponse.json({
    property,
    propertyModules: propertyModules ?? [],
    propertyOverrides: propertyOverrides ?? [],
  })
}

// PATCH — update editable property fields and/or upsert overrides.
//
// Body may contain any of the editable property fields (name, venue_type,
// primary_color) and/or an `overrides` array of { key, value } pairs.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Property field updates — only whitelisted columns are touched.
  const updates: Record<string, string> = {}
  for (const field of EDITABLE_FIELDS) {
    if (typeof body[field] === 'string') {
      updates[field] = body[field] as string
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from('properties').update(updates).eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // 2. Override upserts — keyed on (property_id, key).
  const overrides = body.overrides
  if (Array.isArray(overrides) && overrides.length > 0) {
    const rows = overrides
      .filter(
        (o): o is { key: string; value: string } =>
          o && typeof o.key === 'string' && o.key.trim() !== '' && typeof o.value === 'string'
      )
      .map((o) => ({
        property_id: id,
        key: o.key.trim(),
        value: o.value,
        updated_at: new Date().toISOString(),
      }))

    if (rows.length > 0) {
      const { error } = await admin
        .from('property_overrides')
        .upsert(rows, { onConflict: 'property_id,key' })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true })
}
