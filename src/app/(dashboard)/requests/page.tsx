import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { RequestCard } from '@/components/requests/RequestCard'
import { RequestFilters } from '@/components/requests/RequestFilters'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import type { BloodRequest } from '@/types'

export const dynamic = 'force-dynamic'

interface SearchParams {
  blood_type?: string
  urgency?: string
  division?: string
  district?: string
  status?: string
  page?: string
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()
  const PAGE_SIZE = 12
  const page = parseInt(searchParams.page ?? '1', 10)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('blood_requests')
    .select('*', { count: 'exact' })

  const status = searchParams.status
  if (!status || status === 'open') {
    query = query.eq('status', 'open')
  } else if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (searchParams.blood_type) query = query.eq('blood_type', searchParams.blood_type)
  if (searchParams.urgency) query = query.eq('urgency', searchParams.urgency)
  if (searchParams.division) query = query.eq('division', searchParams.division)
  if (searchParams.district) query = query.eq('district', searchParams.district)

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const requests = (data ?? []) as BloodRequest[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Blood Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} request{count !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link href="/requests/new">
          <Button className="blood-gradient text-white gap-2">
            <Plus className="h-4 w-4" />
            Post Request
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <aside className="lg:w-64 shrink-0">
          <RequestFilters />
        </aside>

        {/* Results */}
        <div className="flex-1">
          {requests.length === 0 ? (
            <EmptyState message="No blood requests match your filters. Try adjusting them." />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {requests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {page > 1 && (
                    <Link href={`/requests?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}>
                      <Button variant="outline" size="sm">← Previous</Button>
                    </Link>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={`/requests?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}>
                      <Button variant="outline" size="sm">Next →</Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
