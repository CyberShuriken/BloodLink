import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { UserProfileContext } from '@/components/layout/UserProfileContext'
import { Navbar } from '@/components/layout/Navbar'
import { MobileNav } from '@/components/layout/MobileNav'
import type { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) {
    redirect('/login')
  }

  // Get the current pathname from headers for profile-complete redirect check
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('next-url') ?? ''

  // Redirect to profile complete if not done yet (except when already on that page)
  if (!profile.is_profile_complete && !pathname.includes('/profile/complete')) {
    redirect('/profile/complete')
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const notificationCount = unreadCount ?? 0

  return (
    <UserProfileContext.Provider value={profile}>
      <Navbar profile={profile} unreadCount={notificationCount} />
      <MobileNav profile={profile} unreadCount={notificationCount} />
      <main className="pb-20 md:pb-0 pt-14 md:pt-16 min-h-screen">
        {children}
      </main>
    </UserProfileContext.Provider>
  )
}
