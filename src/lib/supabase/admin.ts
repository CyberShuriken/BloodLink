import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client.
 *
 * Bypasses Row Level Security. Use ONLY in server-side contexts
 * (Server Components, API route handlers, Server Actions) where
 * the caller has already been authorized as `admin`.
 *
 * Never import this from a Client Component — it would leak the
 * service role key into the browser bundle.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY — admin operations unavailable')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
