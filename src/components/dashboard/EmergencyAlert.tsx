'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { haversineKm } from '@/lib/utils'
import type { Profile, BloodRequest } from '@/types'

interface EmergencyAlertProps {
  profile: Profile
}

export function EmergencyAlert({ profile }: EmergencyAlertProps) {
  useEffect(() => {
    // Don't subscribe when donor is off duty
    if (!profile.is_available) return

    const supabase = createClient()

    const channel = supabase
      .channel('emergency-blood-requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'blood_requests' },
        (payload) => {
          const req = payload.new as BloodRequest

          // Only alert on critical requests
          if (req.urgency !== 'critical') return

          // Require coordinates on both ends
          if (!req.latitude || !req.longitude) return

          // Only alert if within 10 km
          const dist = haversineKm(
            profile.latitude,
            profile.longitude,
            req.latitude,
            req.longitude
          )
          if (dist > 10) return

          toast.custom(
            (t) => (
              <div
                className="bg-white border-l-4 border-blood animate-flash-red rounded-lg shadow-lg p-4 max-w-sm w-full"
                style={{ borderLeftColor: '#C41E3A' }}
              >
                <p className="font-bold text-blood text-sm">🚨 Critical Blood Request</p>
                <p className="text-sm mt-1">
                  <span className="font-medium">{req.hospital_name}</span> needs{' '}
                  <strong>{req.blood_type}</strong>
                </p>
                <Link
                  href={`/requests/${req.id}`}
                  onClick={() => toast.dismiss(t)}
                  className="inline-block mt-2 text-sm font-semibold text-blood hover:underline"
                >
                  Respond Now →
                </Link>
              </div>
            ),
            { duration: 15000 }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile.is_available, profile.latitude, profile.longitude])

  // Renders nothing — purely a side-effect component
  return null
}
