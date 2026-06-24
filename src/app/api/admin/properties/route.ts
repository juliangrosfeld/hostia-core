import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Turn "Brgr Haus" into "brgr-haus". A short random suffix keeps slugs unique
// even when two clients share a name.
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base || 'client'}-${suffix}`
}

// GET — every property with a count of its ACTIVE assigned modules.
export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const admin = createAdminClient()

  const { data: properties, error: propError } = await admin
    .from('properties')
    .select('*')
    .order('name')

  if (propError) {
    return NextResponse.json({ error: propError.message }, { status: 500 })
  }

  // One query for all active assignments, then tally per property in memory.
  const { data: modules } = await admin
    .from('property_modules')
    .select('property_id, is_active')
    .eq('is_active', true)

  const counts = new Map<string, number>()
  for (const row of modules ?? []) {
    counts.set(row.property_id, (counts.get(row.property_id) ?? 0) + 1)
  }

  const withCounts = (properties ?? []).map((p) => ({
    ...p,
    active_module_count: counts.get(p.id) ?? 0,
  }))

  return NextResponse.json({ properties: withCounts })
}

// POST — create a new property (client).
export async function POST(request: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  let body: { name?: unknown; venue_type?: unknown; primary_color?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const { name, venue_type, primary_color } = body

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Property name is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: property, error } = await admin
    .from('properties')
    .insert({
      name: name.trim(),
      slug: slugify(name),
      venue_type: typeof venue_type === 'string' && venue_type ? venue_type : null,
      primary_color: typeof primary_color === 'string' && primary_color ? primary_color : '#051956',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ property, id: property.id })
}
