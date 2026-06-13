'use client'
import { BloodRequest } from '@/types'
import { RequestCard } from './RequestCard'
import { EmptyState } from '../shared/EmptyState'

interface RequestListProps {
  requests: BloodRequest[]
}

export default function RequestList({ requests }: RequestListProps) {
  if (requests.length === 0) {
    return <EmptyState message="No blood requests found matching your criteria." />
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
    </div>
  )
}
