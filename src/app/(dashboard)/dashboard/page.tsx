import { redirect } from 'next/navigation'
import { Activity, Heart, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { EligibilityBanner } from '@/components/shared/EligibilityBanner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { EmergencyAlert } from '@/components/dashboard/EmergencyAlert'
import { RequestCard } from '@/components/requests/RequestCard'
import { DonorMap } from '@/components/donors/DonorMap'
import { MapErrorBoundary } from '@/components/shared/MapErrorBoundary'
import { AvailabilityToggle } from './AvailabilityToggle'
import type { BloodRequest, Donation, Profile } from '@/types'

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  // Fetch open blood requests — critical first, then urgent, then normal
  const { data: rawRequests } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('status', 'open')
    .order('urgency', { ascending: true }) // lexical: critical < normal < urgent — we'll re-sort below
    .limit(20)

  // Sort: critical first, then urgent, then normal
  const urgencyOrder: Record<string, number> = { critical: 0, urgent: 1, normal: 2 }
  const requests: BloodRequest[] = (rawRequests ?? []).sort(
    (a, b) => (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2)
  )

  // Fetch last 10 donations for the current user
  const { data: rawDonations } = await supabase
    .from('donations')
    .select('*')
    .eq('donor_id', user.id)
    .order('donated_at', { ascending: false })
    .limit(10)

  const donations: Donation[] = rawDonations ?? []

  // Compute stats
  const nearbyCount = requests.filter(
    (r) => r.district === profile.present_district
  ).length

  const donorRank =
    profile.total_donations >= 20
      ? 'Gold'
      : profile.total_donations >= 10
      ? 'Silver'
      : profile.total_donations >= 5
      ? 'Bronze'
      : 'Newcomer'

  const isDonor = profile.role === 'donor'

  return (
    <div>
      <EmergencyAlert profile={profile} />

      {isDonor ? (
        <>
          <div className="block lg:hidden space-y-4 p-4">
            <AvailabilityToggle profile={profile} />

            <EligibilityBanner
              isEligible={profile.is_eligible}
              lastDonationDate={profile.last_donation_date ?? null}
            />

            <div>
              <h2 className="text-base font-semibold mb-3">Nearby Emergency Alerts</h2>
              {requests.length === 0 ? (
                <EmptyState message="No active emergencies nearby. You're all caught up!" />
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-3 gap-6 p-6">
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                <Avatar className="h-20 w-20">
                  {profile.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  )}
                  <AvatarFallback className="bg-blood text-white text-xl font-bold">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-lg leading-tight">{profile.full_name}</p>
                  {profile.blood_type && (
                    <div className="flex justify-center mt-2">
                      <BloodTypeBadge bloodType={profile.blood_type} size="md" />
                    </div>
                  )}
                  {profile.present_district && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {profile.present_district}
                    </p>
                  )}
                </div>
              </div>

              <StatsCard
                title="Total Donations"
                value={profile.total_donations}
                icon={Heart}
                trend={profile.total_donations > 0 ? 'up' : 'neutral'}
                description={profile.total_donations > 0 ? 'Keep it up!' : undefined}
              />
              <StatsCard
                title="Requests Nearby"
                value={nearbyCount}
                icon={MapPin}
                trend={nearbyCount > 0 ? 'up' : 'neutral'}
                description={nearbyCount > 0 ? `${nearbyCount} in your district` : undefined}
              />
              <StatsCard
                title="Donor Rank"
                value={donorRank}
                icon={Activity}
              />

              <AvailabilityToggle profile={profile} />
            </div>

            <div>
              <h2 className="text-base font-semibold mb-3">Live Blood Request Map</h2>
              <MapErrorBoundary fallbackMessage="Unable to load map">
                <DonorMap profile={profile} requests={requests} />
              </MapErrorBoundary>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-3">Donation History</h2>
              {donations.length === 0 && rawDonations === null ? (
                <SkeletonLoader variant="table" />
              ) : (
                <ActivityFeed donations={donations} />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 p-4 lg:p-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-slate-900">Need blood?</h2>
            <p className="mt-2 text-slate-600">Post a request and notify eligible donors in your area immediately.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild className="blood-gradient text-white">
                <a href="/requests/new">Post a new request</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/requests">Browse active requests</a>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Open requests nearby</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{nearbyCount}</p>
            </div>
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Urgent requests</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{requests.filter((r) => r.urgency === 'critical').length}</p>
            </div>
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Available donors in your district</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{donorRank}</p>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Live requests</h2>
            {requests.length === 0 ? (
              <EmptyState message="No active requests at the moment." />
            ) : (
              <div className="space-y-4 mt-4">
                {requests.slice(0, 4).map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
