import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'
import { DEMO_PROPERTY_ID } from '@/lib/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DAY = 86_400_000

// Per-client row the dashboard renders. Pricing (tier / monthly value / MRR) is
// computed CLIENT-SIDE from activeStaff using PRICING_TIERS, so the raw counts
// live here and the dollar math stays in one place on the page.
interface DashboardClient {
  id: string
  name: string
  venue_type: string | null
  primary_color: string | null
  totalStaff: number
  activeStaff: number
  lessonsThisMonth: number
  roleplaysThisMonth: number
  activeModuleCount: number
  // Days since the property's most recent activity (staff sign-in, lesson, or
  // roleplay) within the last 30 days. null → no activity in 30+ days.
  lastActivityDays: number | null
}

interface PropertyRow {
  id: string
  name: string
  venue_type: string | null
  primary_color: string | null
}

export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const admin = createAdminClient()

  const now = Date.now()
  const d30 = now - 30 * DAY
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).getTime()
  // Pull activity from whichever boundary is earlier so a single query covers
  // both the month-to-date counts and the 30-day health window.
  const activityCutoff = new Date(Math.min(d30, monthStart)).toISOString()

  const [propsRes, usersRes, modulesRes, lessonsRes, roleplaysRes] = await Promise.all([
    admin.from('properties').select('id, name, venue_type, primary_color').order('name'),
    admin.from('users').select('property_id, role, last_active'),
    admin.from('property_modules').select('property_id, is_active').eq('is_active', true),
    admin.from('lesson_completions').select('property_id, completed_at').gte('completed_at', activityCutoff),
    admin.from('roleplay_sessions').select('property_id, completed_at').gte('completed_at', activityCutoff),
  ])

  if (propsRes.error) {
    return NextResponse.json({ error: propsRes.error.message }, { status: 500 })
  }

  const properties = (propsRes.data ?? []) as PropertyRow[]

  // ── Tally everything per property in memory ─────────────────────────────────
  const totalStaff = new Map<string, number>()
  const activeStaff = new Map<string, number>()
  const lastActivity = new Map<string, number>() // most-recent activity timestamp
  const moduleCount = new Map<string, number>()
  const lessonsThisMonth = new Map<string, number>()
  const roleplaysThisMonth = new Map<string, number>()

  const bumpActivity = (pid: string, ms: number) => {
    if (!pid) return
    const prev = lastActivity.get(pid) ?? 0
    if (ms > prev) lastActivity.set(pid, ms)
  }

  for (const u of usersRes.data ?? []) {
    if (u.role !== 'staff') continue
    const pid = u.property_id as string
    totalStaff.set(pid, (totalStaff.get(pid) ?? 0) + 1)
    const la = u.last_active ? Date.parse(u.last_active) : 0
    if (la >= d30) {
      activeStaff.set(pid, (activeStaff.get(pid) ?? 0) + 1)
      bumpActivity(pid, la)
    }
  }

  for (const m of modulesRes.data ?? []) {
    const pid = m.property_id as string
    moduleCount.set(pid, (moduleCount.get(pid) ?? 0) + 1)
  }

  for (const l of lessonsRes.data ?? []) {
    const pid = l.property_id as string
    const ms = Date.parse(l.completed_at)
    bumpActivity(pid, ms)
    if (ms >= monthStart) lessonsThisMonth.set(pid, (lessonsThisMonth.get(pid) ?? 0) + 1)
  }

  for (const r of roleplaysRes.data ?? []) {
    const pid = r.property_id as string
    const ms = Date.parse(r.completed_at)
    bumpActivity(pid, ms)
    if (ms >= monthStart) roleplaysThisMonth.set(pid, (roleplaysThisMonth.get(pid) ?? 0) + 1)
  }

  const buildClient = (p: PropertyRow): DashboardClient => {
    const last = lastActivity.get(p.id)
    return {
      id: p.id,
      name: p.name,
      venue_type: p.venue_type,
      primary_color: p.primary_color,
      totalStaff: totalStaff.get(p.id) ?? 0,
      activeStaff: activeStaff.get(p.id) ?? 0,
      lessonsThisMonth: lessonsThisMonth.get(p.id) ?? 0,
      roleplaysThisMonth: roleplaysThisMonth.get(p.id) ?? 0,
      activeModuleCount: moduleCount.get(p.id) ?? 0,
      lastActivityDays: last ? Math.floor((now - last) / DAY) : null,
    }
  }

  const demoRow = properties.find((p) => p.id === DEMO_PROPERTY_ID)
  const clients = properties.filter((p) => p.id !== DEMO_PROPERTY_ID).map(buildClient)
  const demo = demoRow ? buildClient(demoRow) : null

  return NextResponse.json({ clients, demo })
}
