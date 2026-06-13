import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminRequestsTable } from '@/components/admin/AdminRequestsTable'
import type { BloodRequest } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminRequestsPage() {
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

  const { data: requestsData } = await supabase
    .from('blood_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  const requests = (requestsData ?? []) as BloodRequest[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Requests Management</h1>
        <p className="mt-2 text-sm text-slate-600">
          {requests.length} request{requests.length === 1 ? '' : 's'} total. Review, flag
          duplicates, or force-close abusive listings.
        </p>
      </div>

      <AdminRequestsTable initialRequests={requests} />
    </div>
  )
}
