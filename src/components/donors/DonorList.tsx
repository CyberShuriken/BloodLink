'use client'
import { Profile } from '@/types'
import { EmptyState } from '../shared/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BloodTypeBadge } from '../shared/BloodTypeBadge'
import { MapPin, Phone, GraduationCap } from 'lucide-react'

interface DonorListProps {
  donors: Profile[]
}

export default function DonorList({ donors }: DonorListProps) {
  if (donors.length === 0) {
    return <EmptyState message="No donors found matching your criteria." />
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {donors.map((donor) => (
        <Card key={donor.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {donor.full_name}
            </CardTitle>
            <BloodTypeBadge bloodType={donor.blood_type!} />
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>{donor.department}, {donor.batch}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{donor.present_district}, {donor.present_division}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{donor.contact_number}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
