import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProfileEditPage() {
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-blood"
        >
          <ChevronLeft className="h-4 w-4" /> Back to profile
        </Link>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-2">Edit profile</h1>
        <p className="text-sm text-slate-600 mt-1">
          Update your academic details, contact info, or photo.
        </p>
      </div>

      <ProfileEditForm profile={profile} />
    </div>
  )
}
