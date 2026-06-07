import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileCompleteForm } from '@/components/auth/ProfileCompleteForm'
import type { Profile } from '@/types'

export default async function ProfileCompletePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  if (profile.is_profile_complete) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 py-10 px-4">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-full px-4 py-2 mb-4">
          ⚠️ Please complete your profile to start donating
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Complete Your Profile</h1>
        <p className="text-slate-600 mt-2">
          This helps us match you with emergency blood requests in your area.
        </p>
      </div>
      <ProfileCompleteForm profile={profile} />
    </div>
  )
}
