import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/types'

/**
 * Ensures a profile row exists for the authenticated user.
 * If the profile is missing (e.g., trigger failed), inserts a new one.
 * Used by OAuth callback, email registration, and profile/complete page.
 *
 * @param supabase - Supabase client (server or client)
 * @param user - Authenticated user from supabase.auth.getUser()
 * @returns Profile object if successful, null if insert fails
 */
interface AuthUser {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}

export async function ensureProfile(
  supabase: SupabaseClient,
  user: AuthUser
): Promise<Profile | null> {
  if (!user || !user.email) return null

  // Try to fetch existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  // If profile exists, return it
  if (existingProfile) {
    return existingProfile
  }

  // If error is not "no rows", something else went wrong — return null
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[ensureProfile] Fetch error:', fetchError)
    return null
  }

  // Profile doesn't exist — insert one
  // Use same logic as DB trigger: full_name from metadata or email prefix
  const fullName =
    user.user_metadata?.full_name || user.email.split('@')[0] || 'User'

  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      role: 'donor',
    })
    .select('*')
    .single<Profile>()

  if (insertError) {
    console.error('[ensureProfile] Insert error:', insertError)
    return null
  }

  return newProfile
}
