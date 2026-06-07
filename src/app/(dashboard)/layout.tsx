import { redirect } from 'next/navigation'
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

  // Auth guard — redirect to login if no session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch full profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) {
    redirect('/login')
  }

  // Fetch unread notification count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const notificationCount = unreadCount ?? 0

  return (
    <UserProfileContext.Provider value={profile}>
      {/* Desktop navbar */}
      <Navbar profile={profile} unreadCount={notificationCount} />

      {/* Mobile top header + bottom tab bar */}
      <MobileNav profile={profile} unreadCount={notificationCount} />

      <main className="pb-20 md:pb-0 pt-14 md:pt-16">
        {children}
      </main>
    </UserProfileContext.Provider>
  )
}
