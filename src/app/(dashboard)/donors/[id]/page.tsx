import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { EligibilityBanner } from '@/components/shared/EligibilityBanner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapErrorBoundary } from '@/components/shared/MapErrorBoundary'
import { DonorMap } from '@/components/donors/DonorMap'
import type { Profile } from '@/types'

export default async function DonorProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single<Profile>()

  if (!profile) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar className="h-24 w-24">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              ) : (
                <AvatarFallback className="bg-blood text-white text-2xl font-bold">
                  {profile.full_name
                    .split(' ')
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join('')}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-xl font-semibold text-slate-900">{profile.full_name}</p>
              <p className="text-sm text-slate-500">{profile.department ?? 'Donor'}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <BloodTypeBadge bloodType={profile.blood_type ?? 'O+'} size="sm" />
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${profile.is_available ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                  {profile.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Contact</p>
              <p>{profile.contact_number ?? 'Not provided'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Location</p>
              <p>{profile.present_address ?? 'No address provided'}</p>
              <p>{profile.present_district}, {profile.present_division}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Donation count</p>
              <p>{profile.total_donations} donation{profile.total_donations === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <EligibilityBanner isEligible={profile.is_eligible} lastDonationDate={profile.last_donation_date ?? null} />
            <Button asChild className="w-full">
              <a href={`tel:${profile.contact_number ?? ''}`} className="block text-center">
                Contact Donor
              </a>
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-slate-900">About</p>
              <p className="text-sm text-slate-500">Detailed profile information.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">{profile.batch ? `Batch ${profile.batch}` : 'Student'}</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Student ID</p>
              <p className="mt-1 text-sm text-slate-900">{profile.student_id ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Verified</p>
              <p className="mt-1 text-sm text-slate-900">{profile.is_verified ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-500">Bio</p>
            <p className="mt-2 text-sm text-slate-700">{profile.bio ?? 'No additional bio provided.'}</p>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-slate-900">Service area</p>
            <p className="text-sm text-slate-500">Donor location on the map.</p>
          </div>
        </div>
        <div className="mt-6">
          <MapErrorBoundary fallbackMessage="Unable to load donor location map.">
            <DonorMap profile={profile} requests={[]} donors={[]}/>
          </MapErrorBoundary>
        </div>
      </section>
    </div>
  )
}
