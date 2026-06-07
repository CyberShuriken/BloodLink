'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Notification } from '@/types'

interface NotificationsPanelProps {
  initialNotifications: Notification[]
  userId: string
}

export function NotificationsPanel({ initialNotifications, userId }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        setNotifications((current) => [payload.new as Notification, ...current])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        setNotifications((current) => current.map((notification) => notification.id === payload.new.id ? (payload.new as Notification) : notification))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAllRead = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (!error) {
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })))
    }
    setLoading(false)
  }

  if (notifications.length === 0) {
    return <EmptyState message="You have no notifications yet." />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-600">Stay updated with the latest blood requests and responses.</p>
        </div>
        <Button onClick={markAllRead} disabled={loading} className="blood-gradient text-white">
          {loading ? 'Marking read...' : 'Mark all read'}
        </Button>
      </div>

      <div className="grid gap-4">
        {notifications.map((notification) => (
          <div key={notification.id} className={`rounded-3xl border p-5 shadow-sm ${notification.is_read ? 'bg-white' : 'bg-blood-muted border-blood/30'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{notification.title}</p>
                <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{notification.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
