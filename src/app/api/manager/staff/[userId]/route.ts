import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveCurriculum } from '@/lib/curriculum'
import { fullyDoneByModule } from '@/lib/progress-model'
import { getModuleSkillScore } from '@/lib/xp'
import { SCENARIOS } from '@/lib/scenarios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — real drill-down data for one staff member on the manager's property:
// per-module lesson progress + warmth, and the most recent roleplay sessions
// (with transcripts). Powers the StaffProfile "Module progress", "Skill
// profile" and "Recent roleplay scores" sections on real properties.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()

  // 1. Requester must be a signed-in manager or admin with a property.
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: manager, error: managerError } = await supabase
    .from('users')
    .select('property_id, role')
    .eq('auth_id', authUser.id)
    .single()

  if (managerError || !manager) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
  }
  if (manager.role !== 'manager' && manager.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  if (!manager.property_id) {
    return NextResponse.json({ error: 'No property associated with this account' }, { status: 400 })
  }

  // 2. Target must exist, be staff, and be on the manager's property.
  const { userId } = await params
  const admin = createAdminClient()
  const { data: target } = await admin
    .from('users')
    .select('id, role, property_id')
    .eq('id', userId)
    .single()

  if (!target || target.role !== 'staff' || target.property_id !== manager.property_id) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  }

  // 3. Activity reads go through the session client so RLS stays the security
  //    boundary, with explicit property/staff scoping on top — the same
  //    pattern as /api/manager/dashboard. property_modules (non-sensitive
  //    config) is read via the admin client, also mirroring the dashboard.
  const [completionRes, sessionRes, moduleRes] = await Promise.all([
    supabase
      .from('lesson_completions')
      .select('module_id, lesson_id, phase')
      .eq('property_id', manager.property_id)
      .eq('staff_id', userId)
      .limit(5000),
    supabase
      .from('roleplay_sessions')
      .select('module_id, scenario_id, warmth_score, passed, turns, transcript, completed_at')
      .eq('property_id', manager.property_id)
      .eq('staff_id', userId)
      .order('completed_at', { ascending: false })
      .limit(2000),
    admin
      .from('property_modules')
      .select('module_id, order_index, is_active')
      .eq('property_id', manager.property_id)
      .order('order_index'),
  ])

  if (completionRes.error || sessionRes.error) {
    console.error('[staff detail] read error:', completionRes.error ?? sessionRes.error)
    return NextResponse.json({ error: 'Could not load staff data' }, { status: 500 })
  }

  const completions = completionRes.data ?? []
  const sessions = sessionRes.data ?? []
  const modules = resolveCurriculum(moduleRes.data)

  // Per-module FULLY completed lessons (every phase the lesson has — the
  // app-wide lib/progress-model.ts definition) + skill score (avg warmth over
  // PASSED sessions, via the same getModuleSkillScore the mock profile used).
  const doneByModule = fullyDoneByModule(completions, modules)
  const sessionsByModule = new Map<string, { warmth_score: number; passed: boolean }[]>()
  for (const s of sessions) {
    const bucket = sessionsByModule.get(s.module_id) ?? []
    bucket.push({ warmth_score: s.warmth_score, passed: s.passed })
    sessionsByModule.set(s.module_id, bucket)
  }

  const moduleProgress = modules
    .filter((m) => m.id !== 'phase-1-certification')
    .map((m) => ({
      module_id: m.id,
      title: m.title,
      total: m.totalLessons,
      // Capped: a completion row for a lesson later removed from the module
      // must never show 5/4.
      done: Math.min(m.totalLessons, doneByModule.get(m.id)?.size ?? 0),
      warmth: getModuleSkillScore(sessionsByModule.get(m.id) ?? []),
    }))

  // Most recent sessions, enriched with scenario display copy. Only
  // title/subtitle leave the catalog — never systemPrompt.
  const recentSessions = sessions.slice(0, 3).map((s) => {
    const scenario = SCENARIOS[s.scenario_id]
    return {
      scenario_id: s.scenario_id,
      scenario_title: scenario?.title ?? s.scenario_id,
      scenario_subtitle: scenario?.subtitle ?? null,
      warmth_score: s.warmth_score,
      passed: s.passed,
      completed_at: s.completed_at,
      turns: s.turns,
      transcript: Array.isArray(s.transcript) ? s.transcript : [],
    }
  })

  return NextResponse.json({ modules: moduleProgress, recentSessions })
}

// DELETE — a manager permanently removes a staff member from their own property.
//
// Security: the requester must be a signed-in manager, and the target must be a
// staff member on the SAME property. Cross-property deletion is never allowed.
// The target's Supabase Auth user is deleted via the admin client, after their
// child rows are removed in dependency order.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()

  // 1. Requester must be authenticated.
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Requester must be a manager; capture their property_id.
  const { data: manager, error: managerError } = await supabase
    .from('users')
    .select('property_id, role')
    .eq('auth_id', authUser.id)
    .single()

  if (managerError || !manager) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
  }
  if (manager.role !== 'manager') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  if (!manager.property_id) {
    return NextResponse.json({ error: 'No property associated with this account' }, { status: 400 })
  }

  const { userId } = await params
  const admin = createAdminClient()

  // 3. Target must exist, be staff, and be on the manager's property.
  const { data: target, error: targetError } = await admin
    .from('users')
    .select('id, auth_id, role, property_id')
    .eq('id', userId)
    .single()

  if (targetError || !target) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  }
  if (target.role !== 'staff' || target.property_id !== manager.property_id) {
    return NextResponse.json({ error: 'Cannot delete this staff member' }, { status: 403 })
  }

  // 4. Delete child rows in dependency order.
  const scopedTables = ['roleplay_sessions', 'lesson_completions', 'phase_completions'] as const
  for (const table of scopedTables) {
    const { error } = await admin.from(table).delete().eq('staff_id', userId)
    if (error) {
      return NextResponse.json(
        { error: `Failed to delete ${table}: ${error.message}` },
        { status: 500 }
      )
    }
  }

  // 5. Delete the auth user, then the users row.
  if (target.auth_id) {
    const { error: authError } = await admin.auth.admin.deleteUser(target.auth_id)
    if (authError) console.error(`[delete staff] auth user ${target.auth_id}:`, authError.message)
  }

  const { error: deleteError } = await admin.from('users').delete().eq('id', userId)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
