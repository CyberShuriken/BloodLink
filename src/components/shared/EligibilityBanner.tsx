import { format, addDays, parseISO } from 'date-fns'
import { CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EligibilityBannerProps {
  isEligible: boolean
  lastDonationDate: string | null
}

export function EligibilityBanner({ isEligible, lastDonationDate }: EligibilityBannerProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium',
        isEligible
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
      )}
    >
      {isEligible ? (
        <>
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>You are eligible to donate!</span>
        </>
      ) : lastDonationDate ? (
        <>
          <Clock className="h-5 w-5 shrink-0" />
          <span>
            Next eligible date:{' '}
            <strong>
              {format(addDays(parseISO(lastDonationDate), 90), 'dd MMM yyyy')}
            </strong>
          </span>
        </>
      ) : (
        <>
          <Clock className="h-5 w-5 shrink-0" />
          <span>Eligibility status is being reviewed</span>
        </>
      )}
    </div>
  )
}
