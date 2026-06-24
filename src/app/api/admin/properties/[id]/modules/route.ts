import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST — assign a module to this property.
//
// Body: { module_id: string, order_index?: number, is_active?: boolean }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const { id } = await params

  let body: { module_id?: unknown; order_index?: unknown; is_active?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  if (typeof body.module_id !== 'string' || !body.module_id) {
    return NextResponse.json({ error: 'module_id is required' }, { status: 400 })
  }

  const admin = createAdminClient()

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
