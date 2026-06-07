'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface AvailabilityToggleProps {
  profile: Profile
}

export function AvailabilityToggle({ profile }: AvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState(profile.is_available)
  const [isPending, setIsPending] = useState(false)

  const handleToggle = async () => {
    const next = !isAvailable

    // Optimistic update
    setIsAvailable(next)
    setIsPending(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ is_available: next })
      .eq('id', profile.id)

    setIsPending(false)

    if (error) {
      // Revert on failure
      setIsAvailable(!next)
      toast.error('Failed to update availability. Please try again.')
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      className={
        isAvailable
          ? 'bg-slate-500 hover:bg-slate-600 text-white font-semibold w-full'
          : 'bg-blood hover:bg-blood-dark text-white font-semibold w-full'
      }
    >
      {isPending ? 'Updating...' : isAvailable ? 'OFF DUTY' : 'GO AVAILABLE'}
    </Button>
  )
}
