import Link from 'next/link'
import { Activity, Bell, Droplet, Home, Package, ShieldCheck, Users } from 'lucide-react'
import type { Profile } from '@/types'

const links = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Requests', href: '/requests', icon: Droplet },
  { label: 'Donors', href: '/donors', icon: Users },
  { label: 'History', href: '/history', icon: Activity },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  return (
    <aside className="hidden lg:block w-72 shrink-0 border-r border-slate-200 bg-white/90 p-5">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dashboard Menu</p>
        <h2 className="font-display text-2xl font-bold text-slate-900 mt-3">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-600">{profile.full_name}</p>
      </div>

      <nav className="space-y-1">
        {links.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blood-muted hover:text-blood transition-colors"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        {(profile.role === 'blood_bank_admin' || profile.role === 'hospital_staff') && (
          <Link
            href="/inventory"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blood-muted hover:text-blood transition-colors"
          >
            <Package className="h-4 w-4" />
            Inventory
          </Link>
        )}

        {profile.role === 'admin' && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blood-muted hover:text-blood transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Panel
          </Link>
        )}
      </nav>
    </aside>
  )
}
