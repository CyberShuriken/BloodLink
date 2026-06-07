import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/shared/EmptyState'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import type { Donation, BloodRequest, DonorResponse, Profile } from '@/types'

export default async function HistoryPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <EmptyState message="Please sign in to see your history." />
  }

  const [, donationsData, requestsData, responsesData] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase.from('donations').select('*').eq('donor_id', user.id).order('donated_at', { ascending: false }).limit(20),
    supabase.from('blood_requests').select('*').eq('requester_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('donor_responses').select('*, blood_requests(*)').eq('donor_id', user.id).order('responded_at', { ascending: false }).limit(20),
  ])

  const donations = (donationsData.data ?? []) as Donation[]
  const requests = (requestsData.data ?? []) as BloodRequest[]
  const responses = (responsesData.data ?? []) as DonorResponse[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">My Activity</h1>
        <p className="mt-2 text-sm text-slate-600">Track your donations, requests, and responses in one place.</p>
      </div>

      <Tabs defaultValue="donations">
        <TabsList className="space-x-2">
          <TabsTrigger value="donations">My Donations</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
          <TabsTrigger value="responses">My Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="mt-6">
          {donations.length === 0 ? (
            <EmptyState message="No donations recorded yet." />
          ) : (
            <div className="grid gap-4">
              {donations.map((donation) => (
                <div key={donation.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{donation.hospital_name}</p>
                      <p className="text-sm text-slate-500">{new Date(donation.donated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BloodTypeBadge bloodType={donation.blood_type} size="sm" />
                      <span className="rounded-full bg-blood-muted px-3 py-1 text-sm font-semibold text-blood">{donation.units_donated} unit{donation.units_donated === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          {requests.length === 0 ? (
            <EmptyState message="No active requests yet." />
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <div key={request.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{request.hospital_name}</p>
                      <p className="text-sm text-slate-500">{request.district}, {request.division}</p>
                    </div>
                    <div className="text-sm text-slate-600">{request.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="responses" className="mt-6">
          {responses.length === 0 ? (
            <EmptyState message="No donor responses yet." />
          ) : (
            <div className="grid gap-4">
              {responses.map((response) => (
                <div key={response.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{response.blood_requests?.hospital_name ?? 'Request'}</p>
                      <p className="text-sm text-slate-500">{response.status}</p>
                    </div>
                    <div className="text-sm text-slate-600">Responded {new Date(response.responded_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
