import { createClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/profile-bootstrap'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/login?error=auth`)

    // Ensure profile exists (trigger may have failed)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await ensureProfile(supabase, user)
    }
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
