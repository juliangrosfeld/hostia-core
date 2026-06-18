import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: return the property_modules rows for the signed-in user's property.
// The staff curriculum is rebuilt from these on the client via resolveCurriculum().
// Read-only — never mutates property_modules.
export async function GET() {
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
    .select('property_id')
    .eq('auth_id', user.id)
    .single();

  // No property on the profile → no configuration; client falls back to full curriculum.
  if (!profile?.property_id) {
    return NextResponse.json({ propertyModules: [] });
  }

  const admin = createAdminClient();
  const { data: propertyModules, error } = await admin
    .from('property_modules')
    .select('module_id, order_index, is_active')
    .eq('property_id', profile.property_id)
    .order('order_index');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ propertyModules: propertyModules ?? [] });
}
