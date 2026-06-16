'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Profile } from '@/types'

// Leaflet default icons are often broken in Next.js builds.
// We use divIcons for everything to avoid external asset dependency issues.
const customIcon = typeof window !== 'undefined' ? L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#C41E3A;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
}) : null;

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
        <Marker key={donor.id} position={[donor.latitude!, donor.longitude!]} icon={customIcon!}>
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
