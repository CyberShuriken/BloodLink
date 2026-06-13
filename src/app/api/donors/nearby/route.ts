import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const bloodType = searchParams.get('bloodType')
  const division = searchParams.get('division')
  const district = searchParams.get('district')

  const supabase = createClient()
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_profile_complete', true)
    .eq('role', 'donor')

  if (bloodType) query = query.eq('blood_type', bloodType)
  if (division) query = query.eq('present_division', division)
  if (district) query = query.eq('present_district', district)

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ donors: data })
}
