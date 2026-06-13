'use client'
import { BloodRequest } from '@/types'
import { RequestCard } from '../requests/RequestCard'
import { EmptyState } from '../shared/EmptyState'

interface RecentRequestsProps {
  requests: BloodRequest[]
}

export default function RecentRequests({ requests }: RecentRequestsProps) {
  if (requests.length === 0) {
    return <EmptyState message="No recent blood requests found." />
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Requests</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  )
}
