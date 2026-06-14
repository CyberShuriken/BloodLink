import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BloodRequest } from '@/types'

export function useRequests(filters?: {
  blood_type?: string
  division?: string
  district?: string
  status?: string
}) {
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let query = supabase.from('blood_requests').select('*')

    if (filters?.blood_type) query = query.eq('blood_type', filters.blood_type)
    if (filters?.division) query = query.eq('division', filters.division)
    if (filters?.district) query = query.eq('district', filters.district)
    if (filters?.status) query = query.eq('status', filters.status)

    query
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRequests((data ?? []) as BloodRequest[])
        setLoading(false)
      })
  }, [filters?.blood_type, filters?.division, filters?.district, filters?.status])

  return { requests, loading }
}
