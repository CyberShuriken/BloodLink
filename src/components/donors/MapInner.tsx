'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Profile } from '@/types'

// Fix for default marker icons in Leaflet with Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

export default function MapInner({ donors }: { donors: Profile[] }) {
  const valid = donors.filter(d => d.latitude && d.longitude)
  const center: [number, number] = valid.length > 0
    ? [valid[0].latitude!, valid[0].longitude!]
    : [23.8103, 90.4125]

  return (
    <MapContainer center={center} zoom={10} className="h-96 w-full rounded-xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {valid.map(donor => (
        <Marker key={donor.id} position={[donor.latitude!, donor.longitude!]}>
          <Popup>
            <p className="font-semibold">{donor.full_name}</p>
            <p className="text-red-600 font-bold">{donor.blood_type}</p>
            <p>{donor.present_district}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
