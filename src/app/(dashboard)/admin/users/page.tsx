import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: usersData } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  const users = (usersData ?? []) as Profile[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">User Management</h1>
        <p className="mt-2 text-sm text-slate-600">
          {users.length} registered user{users.length === 1 ? '' : 's'}. Search, change
          roles, verify accounts, or remove abusers.
        </p>
      </div>

      <AdminUsersTable initialUsers={users} />
    </div>
  )
}
