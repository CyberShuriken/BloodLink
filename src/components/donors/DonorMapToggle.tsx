'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DonorMap } from '@/components/donors/DonorMap'
import { MapErrorBoundary } from '@/components/shared/MapErrorBoundary'
import type { BloodRequest, Profile } from '@/types'

interface DonorMapToggleProps {
  profile: Profile
  requests: BloodRequest[]
  donors: Profile[]
}

export function DonorMapToggle({ profile, requests, donors }: DonorMapToggleProps) {
  const [activeView, setActiveView] = useState<'map' | 'list'>('list')

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Donor map</h2>
          <p className="text-sm text-slate-600 mt-1">Toggle between the interactive map and list view.</p>
        </div>
        <div className="inline-flex rounded-full border border-input bg-white p-1">
          <Button
            type="button"
            variant={activeView === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('list')}
          >
            List
          </Button>
          <Button
            type="button"
            variant={activeView === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('map')}
          >
            Map
          </Button>
        </div>
      </div>

      {activeView === 'map' ? (
        <div className="rounded-3xl overflow-hidden border bg-white shadow-sm">
          <MapErrorBoundary fallbackMessage="Unable to load donor map">
            <DonorMap profile={profile} requests={requests} donors={donors} />
          </MapErrorBoundary>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {donors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              No donors found for these filters.
            </div>
          ) : (
            donors.map((donor) => (
              <div key={donor.id} className="rounded-3xl border p-5 bg-white shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{donor.full_name}</p>
                <p className="mt-1 text-xs text-slate-500">{donor.present_district}, {donor.present_division}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-blood px-3 py-1 text-xs font-bold text-blood">{donor.blood_type ?? 'N/A'}</span>
                  <span className="text-xs text-slate-500">{donor.is_available ? 'Available now' : 'Unavailable'}</span>
                </div>
                <p className="mt-3 text-xs text-slate-500 line-clamp-3">{donor.bio ?? 'No donor bio available.'}</p>
                <a href={`/donors/${donor.id}`} className="mt-4 inline-flex items-center justify-center rounded-full bg-blood px-3 py-2 text-xs font-semibold text-white hover:bg-blood/90">
                  View profile
                </a>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
