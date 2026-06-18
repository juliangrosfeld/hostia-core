import { createClient } from '@supabase/supabase-js'

// Service-role client — NEVER import this in client components.
// Used only in API routes for admin operations (creating auth users, etc).
//
// Env vars are read INSIDE this function (at request time), never at module
// load, so the values are always resolved in the running serverless function
// rather than captured during the build.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'createAdminClient: NEXT_PUBLIC_SUPABASE_URL is not set in the environment.'
    )
  }
  if (!serviceRoleKey) {
    throw new Error(
      'createAdminClient: SUPABASE_SERVICE_ROLE_KEY is not set in the environment.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
