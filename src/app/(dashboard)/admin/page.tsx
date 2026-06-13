import { redirect } from 'next/navigation'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Activity, Droplet, ShieldCheck, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminCharts } from '@/components/dashboard/AdminCharts'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { AdminVerifyActions } from '@/components/admin/AdminVerifyActions'
import type { BloodRequest, Donation, Profile } from '@/types'

export const dynamic = 'force-dynamic'

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

  // Parallel fetch: stats + verification queue + recent activity
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    { count: totalUsers },
    { data: openRequestsData },
    { data: thisMonthDonationsData },
    { count: pendingVerifications },
    { data: verificationQueueData },
    { data: usersData },
    { data: requestsData },
    { data: recentRequestsData },
    { data: recentDonationsData },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('blood_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase
      .from('donations')
      .select('id, donated_at')
      .gte('donated_at', startOfMonth.toISOString().slice(0, 10)),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('role', ['hospital_staff', 'blood_bank_admin'])
      .eq('is_verified', false),
    supabase
      .from('profiles')
      .select('*')
      .in('role', ['hospital_staff', 'blood_bank_admin'])
      .eq('is_verified', false)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
    supabase
      .from('blood_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('blood_requests')
      .select('id, patient_name, hospital_name, blood_type, urgency, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('donations')
      .select('id, hospital_name, donated_at, blood_type, units_donated')
      .order('donated_at', { ascending: false })
      .limit(5),
  ])

  const users = (usersData ?? []) as Profile[]
  const requests = (requestsData ?? []) as BloodRequest[]
  const queue = (verificationQueueData ?? []) as Profile[]
  const donationsThisMonth = (thisMonthDonationsData ?? []) as Pick<Donation, 'id' | 'donated_at'>[]
  const recentRequests = (recentRequestsData ?? []) as Pick<
    BloodRequest,
    'id' | 'patient_name' | 'hospital_name' | 'blood_type' | 'urgency' | 'created_at'
  >[]
  const recentDonations = (recentDonationsData ?? []) as Pick<
    Donation,
    'id' | 'hospital_name' | 'donated_at' | 'blood_type' | 'units_donated'
  >[]

  // Build merged activity feed (last 10)
  const mergedActivity: Array<{
    id: string
    kind: 'request' | 'donation'
    label: string
    sub: string
    at: string
  }> = [
    ...recentRequests.map((r) => ({
      id: r.id,
      kind: 'request' as const,
      label: `New request: ${r.blood_type} for ${r.patient_name}`,
      sub: r.hospital_name,
      at: r.created_at,
    })),
    ...recentDonations.map((d) => ({
      id: d.id,
      kind: 'donation' as const,
      label: `Donation: ${d.blood_type} ×${d.units_donated}`,
      sub: d.hospital_name,
      at: d.donated_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10)

  const stats = [
    { label: 'Total registered users', value: totalUsers ?? 0, icon: Users, color: 'text-blue-600' },
    { label: 'Active blood requests', value: openRequestsData?.length ?? 0, icon: Droplet, color: 'text-blood' },
    { label: 'Donations this month', value: donationsThisMonth.length, icon: Activity, color: 'text-green-600' },
    { label: 'Pending verifications', value: pendingVerifications ?? 0, icon: ShieldCheck, color: 'text-orange-600' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage user verification, review requests, and monitor platform health.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-600">{s.label}</p>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-slate-900">
              {s.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts users={users} requests={requests} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Verification queue */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-slate-900">Verification queue</h2>
            <Button asChild variant="ghost" size="sm">
              <a href="/admin/users">View all users →</a>
            </Button>
          </div>
          {queue.length === 0 ? (
            <p className="text-sm text-slate-600">No pending verifications right now.</p>
          ) : (
            <ul className="space-y-3">
              {queue.map((u) => (
                <li key={u.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {u.full_name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      <p className="text-xs text-slate-500 mt-1 capitalize">
                        {u.role.replace('_', ' ')} ·{' '}
                        {formatDistanceToNow(parseISO(u.created_at))} ago
                      </p>
                    </div>
                  </div>
                  <AdminVerifyActions userId={u.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent activity */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-display font-bold text-slate-900 mb-4">Recent activity</h2>
          {mergedActivity.length === 0 ? (
            <p className="text-sm text-slate-600">No recent activity.</p>
          ) : (
            <ul className="space-y-3">
              {mergedActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <div
                    className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                      a.kind === 'request' ? 'bg-blood' : 'bg-green-600'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800">{a.label}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {a.sub} · {formatDistanceToNow(parseISO(a.at))} ago
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick links */}
      <section className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          href="/admin/users"
          title="User management"
          description="Change roles, verify, deactivate, or delete users."
        />
        <QuickLink
          href="/admin/requests"
          title="Requests management"
          description="Force-close, flag, or review every blood request."
        />
        <QuickLink
          href="/requests"
          title="All requests"
          description="View the public listing (filters and search included)."
        />
      </section>

      {/* Recent critical requests */}
      {requests.filter((r) => r.urgency === 'critical' && r.status === 'open').length > 0 && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-display font-bold text-slate-900 mb-4">
            🚨 Currently critical
          </h2>
          <ul className="space-y-3">
            {requests
              .filter((r) => r.urgency === 'critical' && r.status === 'open')
              .slice(0, 5)
              .map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-blood/20 bg-red-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.hospital_name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {r.patient_name} · {r.district}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <BloodTypeBadge bloodType={r.blood_type} size="sm" />
                    <UrgencyBadge urgency={r.urgency} />
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <a
      href={href}
      className="block rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <p className="font-display font-bold text-slate-900">{title}</p>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
      <p className="mt-3 text-sm text-blood font-medium">Open →</p>
    </a>
  )
}
