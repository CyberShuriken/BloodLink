import { format, parseISO } from 'date-fns'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Donation } from '@/types'

interface ActivityFeedProps {
  donations: Donation[]
}

export function ActivityFeed({ donations }: ActivityFeedProps) {
  if (donations.length === 0) {
    return <EmptyState message="No donation history yet." />
  }

  return (
    <div className="overflow-y-auto max-h-96 space-y-3 pr-1">
      {donations.map((donation) => (
        <div
          key={donation.id}
          className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{donation.hospital_name}</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {format(parseISO(donation.donated_at), 'dd MMM yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <BloodTypeBadge bloodType={donation.blood_type} size="sm" />
            <span className="text-muted-foreground text-xs">{donation.units_donated}u</span>
          </div>
        </div>
      ))}
    </div>
  )
}
