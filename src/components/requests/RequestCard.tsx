import Link from 'next/link'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BloodRequest } from '@/types'

interface RequestCardProps {
  request: BloodRequest
}

export function RequestCard({ request }: RequestCardProps) {
  return (
    <article
      aria-label={`Blood request at ${request.hospital_name}, urgency ${request.urgency}, blood type ${request.blood_type}`}
      className={cn(
        'rounded-xl border p-4',
        request.urgency === 'critical' && 'border-l-4 border-blood bg-blood-muted'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{request.hospital_name}</h3>
        <UrgencyBadge urgency={request.urgency} />
      </div>

      <p className="text-muted-foreground text-sm mt-1">{request.district}</p>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <BloodTypeBadge bloodType={request.blood_type} size="sm" />
        <span className="text-sm text-foreground">{request.units_needed} units needed</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDistanceToNow(parseISO(request.created_at))} ago
        </span>
      </div>

      <Link href={`/requests/${request.id}`} className="block mt-3">
        <Button variant="outline" size="sm" className="w-full">
          View Details
        </Button>
      </Link>
    </article>
  )
}
