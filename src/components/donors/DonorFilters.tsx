'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BLOOD_TYPES, DIVISIONS_DISTRICTS } from '@/lib/constants'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function DonorFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const division = searchParams.get('division') ?? ''
  const districts = division ? DIVISIONS_DISTRICTS[division] ?? [] : []

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const clearAll = () => {
    router.push(pathname)
  }

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="rounded-xl border bg-white p-4 space-y-4 sticky top-20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filter donors</h3>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-blood hover:underline">
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Blood type</Label>
          <div className="grid grid-cols-4 gap-1">
            {BLOOD_TYPES.map((bt) => {
              const active = searchParams.get('blood_type') === bt
              return (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setParam('blood_type', active ? null : bt)}
                  className={`rounded border py-1 text-xs font-bold transition-all ${
                    active ? 'blood-gradient text-white border-blood' : 'border-input hover:border-blood hover:text-blood'
                  }`}
                >
                  {bt}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Division</Label>
          <Select
            value={searchParams.get('division') ?? 'all'}
            onValueChange={(value) => {
              setParam('division', value)
              setParam('district', null)
            }}
          >
            <SelectTrigger className="text-sm h-9">
              <SelectValue placeholder="Any division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any division</SelectItem>
              {Object.keys(DIVISIONS_DISTRICTS).map((divisionKey) => (
                <SelectItem key={divisionKey} value={divisionKey}>{divisionKey}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {districts.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">District</Label>
            <Select
              value={searchParams.get('district') ?? 'all'}
              onValueChange={(value) => setParam('district', value)}
            >
              <SelectTrigger className="text-sm h-9">
                <SelectValue placeholder="Any district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any district</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>{district}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Availability</Label>
        <Select
          value={searchParams.get('available') ?? 'available'}
          onValueChange={(value) => setParam('available', value)}
        >
          <SelectTrigger className="text-sm h-9">
            <SelectValue placeholder="Any availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="all">All donors</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
