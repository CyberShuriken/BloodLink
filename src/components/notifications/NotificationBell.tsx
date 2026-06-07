import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationBellProps {
  unreadCount: number
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  return (
    <Link href="/notifications" className="relative inline-flex">
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-5 w-5 text-slate-600" />
      </Button>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blood text-white text-[10px] font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
