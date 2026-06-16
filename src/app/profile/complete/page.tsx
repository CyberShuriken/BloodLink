import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/profile-bootstrap'
import { ProfileCompleteForm } from '@/components/auth/ProfileCompleteForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProfileCompletePage() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Ensure profile exists (bootstrap if missing)
    const profile = await ensureProfile(supabase, user)

    // If profile bootstrap failed, show friendly error
    if (!profile) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 py-10 px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-200 shadow-lg">
              <CardHeader className="text-center">
                <div className="mb-4 text-4xl">❌</div>
                <CardTitle className="text-2xl font-display text-red-900">
                  Could Not Set Up Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-slate-600">
                  We encountered an issue creating your profile. This is usually temporary.
                </p>
                <p className="text-sm text-slate-500">
                  Please try refreshing the page, or contact support if the problem persists.
                </p>
                <div className="pt-4">
                  <a
                    href="/"
                    className="inline-block px-6 py-2 bg-blood text-white rounded-lg hover:bg-blood/90 font-medium"
                  >
                    Go to Home
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // If profile is already complete, redirect to dashboard
    if (profile.is_profile_complete) {
      redirect('/dashboard')
    }

    // Render the onboarding form
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 py-10 px-4">
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-full px-4 py-2 mb-4">
            ⚠️ Please complete your profile to start donating
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Complete Your Profile
          </h1>
          <p className="text-slate-600 mt-2">
            This helps us match you with emergency blood requests in your area.
          </p>
        </div>
        <ProfileCompleteForm profile={profile} />
      </div>
    )
  } catch (error) {
    console.error('[ProfileCompletePage] Unexpected error:', error)
    throw error
  }
}
