import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Calendar, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { EligibilityBanner } from '@/components/shared/EligibilityBanner'
import { EmptyState } from '@/components/shared/EmptyState'
import { RequestCard } from '@/components/requests/RequestCard'
import type { BloodRequest, Donation, Profile } from '@/types'

export const dynamic = 'force-dynamic'

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default async function ProfileViewPage() {
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

  // Last 5 donations
  const { data: donationsData } = await supabase
    .from('donations')
    .select('*')
    .eq('donor_id', user.id)
    .order('donated_at', { ascending: false })
    .limit(5)
  const donations = (donationsData ?? []) as Donation[]

  // Last 5 of user's own requests
  const { data: requestsData } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  const requests = (requestsData ?? []) as BloodRequest[]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header card */}
      <section className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-blood-muted">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            )}
            <AvatarFallback className="bg-blood text-white text-2xl font-bold">
              {getInitials(profile.full_name || '?')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                {profile.full_name || 'Anonymous Donor'}
              </h1>
              {profile.blood_type && <BloodTypeBadge bloodType={profile.blood_type} size="md" />}
              {profile.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground capitalize">{profile.role.replace('_', ' ')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blood shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              {profile.contact_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blood shrink-0" />
                  {profile.contact_number}
                </div>
              )}
              {profile.present_district && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blood shrink-0" />
                  {profile.present_district}, {profile.present_division}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blood shrink-0" />
                Member since {format(parseISO(profile.created_at), 'MMM yyyy')}
              </div>
            </div>
          </div>

          <Button asChild variant="outline" className="self-start">
            <a href="/profile/edit">Edit profile</a>
          </Button>
        </div>

        {/* Stat strip */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <Stat label="Total donations" value={profile.total_donations} />
          <Stat
            label="Status"
            value={profile.is_available ? 'Available' : 'Off duty'}
            accent={profile.is_available}
          />
          <Stat
            label="Eligibility"
            value={profile.is_eligible ? 'Eligible' : 'Cooling down'}
            accent={profile.is_eligible}
          />
        </div>
      </section>

      {/* Eligibility banner */}
      <EligibilityBanner
        isEligible={profile.is_eligible}
        lastDonationDate={profile.last_donation_date ?? null}
      />

      {/* Two-column secondary info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-display font-bold text-lg mb-4">Academic & contact</h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <Field label="Student ID" value={profile.student_id} />
            <Field label="Department" value={profile.department} />
            <Field label="Batch" value={profile.batch} />
            <Field label="Blood type" value={profile.blood_type} />
            <Field
              label="Present address"
              value={profile.present_address}
              fullWidth
            />
            <Field
              label="Permanent address"
              value={profile.permanent_address}
              fullWidth
            />
          </dl>
          {profile.bio && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Bio</p>
              <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-display font-bold text-lg mb-4">Recent donations</h2>
          {donations.length === 0 ? (
            <EmptyState message="No donations yet. You'll see them here once you complete one." />
          ) : (
            <ul className="space-y-3">
              {donations.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{d.hospital_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(d.donated_at), 'PPP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <BloodTypeBadge bloodType={d.blood_type} size="sm" />
                    <span className="text-xs text-slate-600">{d.units_donated} unit</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* My requests */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg mb-4">My recent requests</h2>
        {requests.length === 0 ? (
          <EmptyState message="You haven't posted any requests yet." />
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-xl font-bold ${
          accent === undefined
            ? 'text-slate-900'
            : accent
            ? 'text-green-700'
            : 'text-slate-500'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  fullWidth,
}: {
  label: string
  value: string | number | null | undefined
  fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-slate-800 mt-0.5">{value ?? '—'}</dd>
    </div>
  )
}
