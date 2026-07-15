import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST — assign one module or a batch of modules to this property.
//
// Body: { module_id: string, order_index?: number, is_active?: boolean }
//   or: { module_ids: string[] }  (bulk — e.g. the "Assign all" phase button;
//        already-assigned ids are skipped, the rest append in array order)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { id } = await params

  let body: { module_id?: unknown; module_ids?: unknown; order_index?: unknown; is_active?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const admin = createAdminClient()

  // ── Bulk path ─────────────────────────────────────────────────
  if (Array.isArray(body.module_ids)) {
    const ids = body.module_ids.filter((m): m is string => typeof m === 'string' && m !== '')
    if (ids.length === 0) {
      return NextResponse.json({ error: 'module_ids must contain at least one module id' }, { status: 400 })
    }

    const { data: existing } = await admin
      .from('property_modules')
      .select('module_id, order_index')
      .eq('property_id', id)

    const already = new Set((existing ?? []).map((r) => r.module_id))
    const nextOrder = (existing ?? []).reduce((max, r) => Math.max(max, r.order_index + 1), 0)
    const missing = ids.filter((m) => !already.has(m))

    if (missing.length > 0) {
      const { error } = await admin.from('property_modules').insert(
        missing.map((moduleId, i) => ({
          property_id: id,
          module_id: moduleId,
          order_index: nextOrder + i,
          is_active: true,
        }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assigned: missing.length, skipped: ids.length - missing.length })
  }

  // ── Single-module path ────────────────────────────────────────
  if (typeof body.module_id !== 'string' || !body.module_id) {
    return NextResponse.json({ error: 'module_id is required' }, { status: 400 })
  }

  // Already assigned? Treat as a no-op success so the toggle stays idempotent.
  const { data: existingRow } = await admin
    .from('property_modules')
    .select('module_id, order_index, is_active')
    .eq('property_id', id)
    .eq('module_id', body.module_id)
    .maybeSingle()

  if (existingRow) {
    return NextResponse.json({ propertyModule: existingRow, alreadyAssigned: true })
  }

  // Default the order to the end of the current list if not specified.
  let orderIndex = typeof body.order_index === 'number' ? body.order_index : null
  if (orderIndex === null) {
    const { data: last } = await admin
      .from('property_modules')
      .select('order_index')
      .eq('property_id', id)
      .order('order_index', { ascending: false })
      .limit(1)
    orderIndex = last && last.length > 0 ? last[0].order_index + 1 : 0
  }

  const { data, error } = await admin
    .from('property_modules')
    .insert({
      property_id: id,
      module_id: body.module_id,
      order_index: orderIndex,
      is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ propertyModule: data })
}

// DELETE — remove a module from this property.
//
// module_id comes from the `module_id` query param, or the JSON body.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { id } = await params

  let moduleId = request.nextUrl.searchParams.get('module_id')
  if (!moduleId) {
    try {
      const body = await request.json()
      if (typeof body?.module_id === 'string') moduleId = body.module_id
    } catch {
      // no body — fall through to the missing-param error below
    }
  }

  if (!moduleId) {
    return NextResponse.json({ error: 'module_id is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('property_modules')
    .delete()
    .eq('property_id', id)
    .eq('module_id', moduleId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
