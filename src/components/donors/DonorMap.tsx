import dynamic from 'next/dynamic'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import type { Profile, BloodRequest } from '@/types'

interface DonorMapProps {
  profile: Profile
  requests?: BloodRequest[]
  donors?: Profile[]
}

const DonorMapInner = dynamic(() => import('./DonorMapInner'), {
  ssr: false,
  loading: () => <SkeletonLoader variant="map" />,
})

export function DonorMap(props: DonorMapProps) {
  return <DonorMapInner {...props} />
}
