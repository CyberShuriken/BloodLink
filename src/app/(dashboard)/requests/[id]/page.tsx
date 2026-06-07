import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RequestDetail } from '@/components/requests/RequestDetail'
import type { BloodRequest, DonorResponse, Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: requestData } = await supabase
    .from('blood_requests')
    .select('*, profiles(*)')
    .eq('id', params.id)
    .single()

  if (!requestData) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let currentUser: Profile | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>()
    currentUser = profile
  }

  const { data: responsesData } = await supabase
    .from('donor_responses')
    .select('*, profiles(*)')
    .eq('request_id', params.id)
    .order('responded_at', { ascending: false })

  const responses = (responsesData ?? []) as DonorResponse[]
  const hasResponded = user ? responses.some((r) => r.donor_id === user.id) : false

  return (
    <RequestDetail
      request={requestData as BloodRequest}
      responses={responses}
      currentUser={currentUser}
      hasResponded={hasResponded}
    />
  )
}
