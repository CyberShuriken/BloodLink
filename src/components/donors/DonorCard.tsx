import Link from 'next/link'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import type { Profile } from '@/types'

interface DonorCardProps {
  donor: Profile
}

export function DonorCard({ donor }: DonorCardProps) {
  return (
    <article className="rounded-3xl border bg-white p-6 shadow-sm">
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
  )
}
