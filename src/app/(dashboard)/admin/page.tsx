import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminCharts } from '@/components/dashboard/AdminCharts'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import type { Profile, BloodRequest } from '@/types'

export default async function AdminPage() {
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
  if (profile.role !== 'admin') {
    return <EmptyState message="Admin dashboard access is restricted." />
  }

  const [{ data: usersData }, { data: requestsData }, { data: verificationQueue }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('blood_requests').select('*').order('created_at', { ascending: false }).limit(200),
    supabase
      .from('profiles')
      .select('*')
      .eq('is_verified', false)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const users = (usersData ?? []) as Profile[]
  const requests = (requestsData ?? []) as BloodRequest[]
  const queue = (verificationQueue ?? []) as Profile[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Manage user verification, review requests, and monitor platform health.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Verification queue</h2>
          {queue.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No pending verifications right now.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {queue.map((user) => (
                <div key={user.id} className="rounded-3xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{user.full_name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">Verify</Button>
                    <Button variant="ghost" size="sm">Review</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Platform metrics</h2>
          <p className="mt-2 text-sm text-slate-600">Users: {users.length}, active requests: {requests.length}</p>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-blood-muted p-4">
              <p className="text-sm text-slate-900">Total users</p>
              <p className="text-3xl font-bold text-blood">{users.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Open requests</p>
              <p className="text-3xl font-bold text-slate-900">{requests.filter((req) => req.status === 'open').length}</p>
            </div>
          </div>
        </div>
      </div>

      <AdminCharts users={users} requests={requests} />
    </div>
  )
}
