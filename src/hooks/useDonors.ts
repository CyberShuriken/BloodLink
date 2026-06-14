import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function useDonors(filters?: {
  blood_type?: string
  division?: string
  district?: string
  available?: boolean
}) {
  const [donors, setDonors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'donor')
      .eq('is_profile_complete', true)

    if (filters?.blood_type) query = query.eq('blood_type', filters.blood_type)
    if (filters?.division) query = query.eq('present_division', filters.division)
    if (filters?.district) query = query.eq('present_district', filters.district)
    if (filters?.available !== undefined) query = query.eq('is_available', filters.available)

    query
      .order('total_donations', { ascending: false })
      .then(({ data }) => {
        setDonors((data ?? []) as Profile[])
        setLoading(false)
      })
  }, [filters?.blood_type, filters?.division, filters?.district, filters?.available])

  return { donors, loading }
}
