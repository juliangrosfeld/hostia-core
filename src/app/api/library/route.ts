import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: fetch all modules + which ones are assigned to a property
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const propertyId = request.nextUrl.searchParams.get('property_id');
  if (!propertyId) return NextResponse.json({ error: 'property_id required' }, { status: 400 });

  const admin = createAdminClient();

  const { data: allModules } = await admin
    .from('modules')
    .select('*')
    .order('order_index');

  const { data: propertyModules } = await admin
    .from('property_modules')
    .select('*')
    .eq('property_id', propertyId)
    .order('order_index');

  return NextResponse.json({ allModules, propertyModules });
}

// POST: save module assignments for a property
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { property_id, modules } = await request.json();
  if (!property_id || !modules) {
    return NextResponse.json({ error: 'property_id and modules required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Delete existing assignments for this property
  await admin.from('property_modules').delete().eq('property_id', property_id);

  // Insert new assignments
  const rows = modules.map((m: { module_id: string; order_index: number; is_active: boolean }) => ({
    property_id,
    module_id: m.module_id,
    order_index: m.order_index,
    is_active: m.is_active,
  }));

  const { error } = await admin.from('property_modules').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
