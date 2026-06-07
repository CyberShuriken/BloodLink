'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  Home,
  Droplet,
  Users,
  User,
  Plus,
  Bell,
  History,
  Droplets,
  ShieldCheck,
  Package,
  LogOut,
  Settings,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'
import { useRouter } from 'next/navigation'

// Bottom-tab definitions (excluding FAB center slot)
const BOTTOM_TABS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Requests', href: '/requests', icon: Droplet },
  null, // FAB placeholder
  { label: 'Donors', href: '/donors', icon: Users },
  { label: 'Profile', href: '/profile', icon: User },
] as const

// Drawer navigation links
const DRAWER_LINKS = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Find Donors', href: '/donors', icon: Users },
  { label: 'Requests', href: '/requests', icon: Droplet },
  { label: 'History', href: '/history', icon: History },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

interface MobileNavProps {
  profile: Profile
  unreadCount: number
}

export function MobileNav({ profile, unreadCount }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isTabActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* ── Mobile top header ─────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b flex items-center justify-between px-4">
        {/* Hamburger sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 px-0 pt-0">
            <SheetHeader className="px-6 py-5 border-b">
              <SheetTitle asChild>
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blood" />
                  <span className="text-blood font-bold text-lg">BloodLink</span>
                </div>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col py-4">
              {DRAWER_LINKS.map(({ label, href, icon: Icon }) => {
                const active = isTabActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-6 py-3 text-sm transition-colors',
                      active
                        ? 'text-blood font-semibold bg-blood-muted'
                        : 'text-slate-600 hover:text-blood hover:bg-blood-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                )
              })}

              {/* Role-gated: admin */}
              {profile.role === 'admin' && (
                <Link
                  href="/admin"
                  className={cn(
                    'flex items-center gap-3 px-6 py-3 text-sm transition-colors',
                    pathname.startsWith('/admin')
                      ? 'text-blood font-semibold bg-blood-muted'
                      : 'text-slate-600 hover:text-blood hover:bg-blood-muted'
                  )}
                >
                  <ShieldCheck className="h-5 w-5" />
                  Admin
                </Link>
              )}

              {/* Role-gated: hospital staff / blood bank admin */}
              {(profile.role === 'hospital_staff' ||
                profile.role === 'blood_bank_admin') && (
                <Link
                  href="/inventory"
                  className={cn(
                    'flex items-center gap-3 px-6 py-3 text-sm transition-colors',
                    pathname.startsWith('/inventory')
                      ? 'text-blood font-semibold bg-blood-muted'
                      : 'text-slate-600 hover:text-blood hover:bg-blood-muted'
                  )}
                >
                  <Package className="h-5 w-5" />
                  Inventory
                </Link>
              )}

              <div className="mt-auto border-t mx-6 pt-4">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 py-2 text-sm text-slate-600 hover:text-blood"
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 py-2 text-sm text-red-600 hover:text-red-700 w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Centered title */}
        <span className="absolute left-1/2 -translate-x-1/2 text-blood font-bold text-lg">
          BloodLink
        </span>

        {/* Right: notification bell */}
        <Link href="/notifications" className="relative">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5 text-slate-600" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blood text-white text-[10px] font-bold pointer-events-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* ── Bottom tab bar ────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5 h-full items-center">
          {BOTTOM_TABS.map((tab) => {
            // FAB center slot
            if (tab === null) {
              return (
                <div key="fab" className="flex items-center justify-center">
                  <Link href="/requests/new" aria-label="New request">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blood text-white shadow-lg -mt-4">
                      <Plus className="h-6 w-6" />
                    </span>
                  </Link>
                </div>
              )
            }

            const { label, href, icon: Icon } = tab
            const active = isTabActive(href)
            const isProfileTab = href === '/profile'

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex flex-col items-center justify-center h-full gap-0.5 text-xs transition-colors',
                  active ? 'text-blood' : 'text-slate-400 hover:text-slate-600'
                )}
                aria-label={label}
              >
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute top-1 h-1.5 w-1.5 rounded-full bg-blood" />
                )}

                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {/* Unread badge on Profile tab */}
                  {isProfileTab && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blood text-white text-[9px] font-bold pointer-events-none">
                      {unreadCount > 99 ? '99' : unreadCount}
                    </span>
                  )}
                </div>

                <span className="text-[10px]">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
