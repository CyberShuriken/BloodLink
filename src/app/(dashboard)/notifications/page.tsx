import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel'
import type { Notification } from '@/types'

export default async function NotificationsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: notificationsData } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (notificationsData ?? []) as Notification[]

  return <NotificationsPanel initialNotifications={notifications} userId={user.id} />
}
