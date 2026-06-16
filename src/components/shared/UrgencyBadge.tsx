import { cn } from '@/lib/utils'
import { URGENCY_CONFIG } from '@/lib/constants'
import type { UrgencyLevel } from '@/types'

interface UrgencyBadgeProps {
  urgency: UrgencyLevel
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const config = URGENCY_CONFIG[urgency]

  if (!config) return null

  return (
    <span
      role="status"
      aria-label={`Urgency: ${urgency}`}
      className={cn(
        config.color,
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
        urgency === 'critical' && 'animate-pulse'
      )}
    >
      {config.icon} {config.label}
    </span>
  )
}
