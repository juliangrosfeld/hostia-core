import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. Verify the requester is authenticated
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Verify the requester is a manager/admin and get their property_id
  const { data: requester, error: requesterError } = await supabase
    .from('users')
    .select('property_id, role')
    .eq('auth_id', authUser.id)
    .single()

  if (requesterError || !requester) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
  }

  if (requester.role !== 'manager' && requester.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // 3. Parse and validate input
  const body = await request.json()
  const { full_name, email, password, role } = body

  if (!full_name || !email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['staff', 'manager'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  // 4. Create the auth user using the admin client
  const admin = createAdminClient()

  const { data: newAuthUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !newAuthUser.user) {
    return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 400 })
  }

  // 5. Insert the row into the users table, scoped to the manager's property
  const { data: newProfile, error: insertError } = await admin
    .from('users')
    .insert({
      auth_id: newAuthUser.user.id,
      property_id: requester.property_id,
      full_name,
      email,
      role,
    })
    .select()
    .single()

  if (insertError) {
    // Roll back the auth user if the profile insert failed
    await admin.auth.admin.deleteUser(newAuthUser.user.id)
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, user: newProfile })
}
