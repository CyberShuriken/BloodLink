import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { DonorFilters } from '@/components/donors/DonorFilters'
import { DonorMapToggle } from '@/components/donors/DonorMapToggle'
import { Button } from '@/components/ui/button'
import type { BloodRequest, Profile } from '@/types'

interface SearchParams {
  blood_type?: string
  division?: string
  district?: string
  available?: string
}

export const dynamic = 'force-dynamic'

export default async function DonorsPage({ searchParams }: { searchParams: SearchParams }) {
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

  let donorQuery = supabase.from('profiles').select('*')
    .eq('role', 'donor')

  if (!searchParams.available || searchParams.available === 'available') {
    donorQuery = donorQuery.eq('is_available', true)
  }
  if (searchParams.blood_type) donorQuery = donorQuery.eq('blood_type', searchParams.blood_type)
  if (searchParams.division) donorQuery = donorQuery.eq('present_division', searchParams.division)
  if (searchParams.district) donorQuery = donorQuery.eq('present_district', searchParams.district)

  const { data: donorsData } = await donorQuery.order('updated_at', { ascending: false }).limit(60)
  const donors = (donorsData ?? []) as Profile[]

  const { data: requestsData } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('status', 'open')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(40)
  const requests = (requestsData ?? []) as BloodRequest[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between mb-8">
        <div>
          <p className="text-sm font-semibold text-blood uppercase tracking-[0.35em]">Donor network</p>
          <h1 className="font-display text-3xl font-bold text-slate-900 mt-3">Find student donors nearby</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Browse active donors by blood type, region, and availability. Toggle the map for a location view.</p>
        </div>
        <Link href="/requests/new">
          <Button className="blood-gradient text-white">Post a request</Button>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24">
          <DonorFilters />
        </aside>

        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">Matched donors</h2>
                <p className="text-sm text-slate-500 mt-1">{donors.length} donor{donors.length === 1 ? '' : 's'} available now.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blood-muted px-3 py-1 text-sm font-semibold text-blood">Blood type filter: {searchParams.blood_type ?? 'Any'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Region: {searchParams.division ?? 'All divisions'}</span>
              </div>
            </div>
          </section>

          <DonorMapToggle profile={profile} requests={requests} donors={donors} />

          <section>
            {donors.length === 0 ? (
              <EmptyState message="No donors match your current filters. Try broadening your search." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {donors.map((donor) => (
                  <article key={donor.id} className="rounded-3xl border bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{donor.full_name}</p>
                        <p className="text-sm text-slate-500">{donor.department ?? 'Student donor'}</p>
                      </div>
                      <BloodTypeBadge bloodType={donor.blood_type ?? 'O+'} size="sm" />
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600">
                      <p>{donor.present_district}, {donor.present_division}</p>
                      <p>{donor.batch ?? 'Batch N/A'}</p>
                      <p>{donor.is_available ? 'Available to donate now' : 'Currently unavailable'}</p>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={`/donors/${donor.id}`} className="rounded-full bg-blood px-4 py-2 text-sm font-semibold text-white hover:bg-blood/90">
                        View profile
                      </Link>
                      <span className="rounded-full border border-blood bg-blood-muted px-3 py-2 text-sm text-blood">Donations: {donor.total_donations}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
