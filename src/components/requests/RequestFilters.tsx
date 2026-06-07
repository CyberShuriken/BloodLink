'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { BLOOD_TYPES, DIVISIONS_DISTRICTS } from '@/lib/constants'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function RequestFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  const division = searchParams.get('division') ?? ''
  const districts = division ? DIVISIONS_DISTRICTS[division] ?? [] : []

  const clearAll = () => {
    router.push(pathname)
  }

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="rounded-xl border bg-white p-4 space-y-4 sticky top-20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-blood hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Blood Type */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Blood Type</Label>
        <div className="grid grid-cols-4 gap-1">
          {BLOOD_TYPES.map((bt) => {
            const active = searchParams.get('blood_type') === bt
            return (
              <button
                key={bt}
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

      {/* Urgency */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Urgency</Label>
        <Select
          value={searchParams.get('urgency') ?? 'all'}
          onValueChange={(v) => setParam('urgency', v)}
        >
          <SelectTrigger className="text-sm h-9">
            <SelectValue placeholder="Any urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any urgency</SelectItem>
            <SelectItem value="critical">🚨 Critical</SelectItem>
            <SelectItem value="urgent">⚠️ Urgent</SelectItem>
            <SelectItem value="normal">ℹ️ Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</Label>
        <Select
          value={searchParams.get('status') ?? 'open'}
          onValueChange={(v) => setParam('status', v)}
        >
          <SelectTrigger className="text-sm h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Division */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Division</Label>
        <Select
          value={searchParams.get('division') ?? 'all'}
          onValueChange={(v) => {
            setParam('division', v)
            setParam('district', null)
          }}
        >
          <SelectTrigger className="text-sm h-9">
            <SelectValue placeholder="Any division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any division</SelectItem>
            {Object.keys(DIVISIONS_DISTRICTS).map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* District */}
      {districts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">District</Label>
          <Select
            value={searchParams.get('district') ?? 'all'}
            onValueChange={(v) => setParam('district', v)}
          >
            <SelectTrigger className="text-sm h-9">
              <SelectValue placeholder="Any district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any district</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
