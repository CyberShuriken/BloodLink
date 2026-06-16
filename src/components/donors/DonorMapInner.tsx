'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import type { Profile, BloodRequest } from '@/types'

// Leaflet default icons are often broken in Next.js builds.
// We use divIcons for everything to avoid external asset dependency issues.

// ── Urgency-coloured divIcon factory ─────────────────────────────────────
function makeUrgencyIcon(urgency: 'critical' | 'urgent' | 'normal') {
  const colors: Record<typeof urgency, string> = {
    critical: '#DC2626', // red-600
    urgent: '#EA580C',   // orange-600
    normal: '#2563EB',   // blue-600
  }
  const color = colors[urgency]
  return L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${color};border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  })
}

// ── Donor's own location icon (blue) ─────────────────────────────────────
const donorIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:24px;height:24px;border-radius:50%;
    background:#1D4ED8;border:3px solid white;
    box-shadow:0 1px 6px rgba(0,0,0,0.5)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
})

interface DonorMapInnerProps {
  profile: Profile
  requests?: BloodRequest[]
  donors?: Profile[]
}

export default function DonorMapInner({ profile, requests = [], donors = [] }: DonorMapInnerProps) {

  const center: [number, number] = [
    profile.latitude ?? 23.8103,
    profile.longitude ?? 90.4125,
  ]

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '400px', width: '100%', borderRadius: '0.75rem' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />

      {/* Donor's own marker */}
      {typeof profile.latitude === 'number' && typeof profile.longitude === 'number' && (
        <Marker
          position={[profile.latitude, profile.longitude]}
          icon={donorIcon}
        >
          <Popup>
            <p className="font-semibold text-sm">Your Location</p>
            <p className="text-xs text-muted-foreground">{profile.full_name}</p>
          </Popup>
        </Marker>
      )}

      {/* Donor markers */}
      {donors
        .filter((donor) => donor.latitude != null && donor.longitude != null)
        .map((donor) => (
          <Marker
            key={donor.id}
            position={[donor.latitude as number, donor.longitude as number]}
            icon={L.divIcon({
              className: '',
              html: `<div style="width:18px;height:18px;border-radius:50%;background:#C41E3A;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
              popupAnchor: [0, -10],
            })}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{donor.full_name}</p>
                <p className="text-muted-foreground">{donor.blood_type ?? 'Unknown type'}</p>
                <p className="text-muted-foreground text-xs">{donor.present_district}, {donor.present_division}</p>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Blood request markers */}
      {requests
        .filter((r) => r.latitude != null && r.longitude != null)
        .map((r) => (
          <Marker
            key={r.id}
            position={[r.latitude as number, r.longitude as number]}
            icon={makeUrgencyIcon(r.urgency)}
          >
            <Popup>
              <div className="space-y-2 text-sm min-w-[160px]">
                <p className="font-semibold leading-tight">{r.hospital_name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <BloodTypeBadge bloodType={r.blood_type} size="sm" />
                  <UrgencyBadge urgency={r.urgency} />
                </div>
                <Link
                  href={`/requests/${r.id}`}
                  className="inline-block mt-1 text-xs font-medium text-blood underline-offset-2 hover:underline"
                >
                  Respond →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  )
}
