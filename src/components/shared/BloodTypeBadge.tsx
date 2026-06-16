import { cn } from '@/lib/utils'
import { BLOOD_TYPE_COLORS } from '@/lib/constants'
import type { BloodType } from '@/types'

interface BloodTypeBadgeProps {
  bloodType: BloodType
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-lg px-4 py-2',
}

export function BloodTypeBadge({ bloodType, size = 'md' }: BloodTypeBadgeProps) {
  const colorClass = BLOOD_TYPE_COLORS[bloodType] || 'bg-slate-100 text-slate-800 border-slate-300'

  return (
    <span
      className={cn(
        colorClass,
        'font-mono font-bold rounded-full border',
        sizeClasses[size]
      )}
      aria-label={`Blood type ${bloodType}`}
    >
      {bloodType}
    </span>
  )
}
