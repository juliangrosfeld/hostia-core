import { createClient } from '@supabase/supabase-js'

// Service-role client — NEVER import this in client components.
// Used only in API routes for admin operations (creating auth users, etc).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
