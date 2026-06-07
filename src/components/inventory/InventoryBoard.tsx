'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BLOOD_TYPES } from '@/lib/constants'
import type { BloodInventory } from '@/types'

interface InventoryBoardProps {
  records: BloodInventory[]
}

export function InventoryBoard({ records }: InventoryBoardProps) {
  const [inventory, setInventory] = useState(records)

  const updateUnits = (id: string, delta: number) => {
    setInventory((current) =>
      current.map((record) =>
        record.id === id
          ? { ...record, units_available: Math.max(0, record.units_available + delta) }
          : record
      )
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {BLOOD_TYPES.map((type) => {
        const record = inventory.find((item) => item.blood_type === type)
        const units = record?.units_available ?? 0
        const low = units <= (record?.low_stock_threshold ?? 2)

        return (
          <div key={type} className={`rounded-3xl border p-5 shadow-sm ${low ? 'border-blood/40 bg-red-50 shadow-red-100' : 'bg-white'}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{type}</p>
                <p className="text-xs text-slate-500">{record?.institution_name ?? 'Unknown bank'}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{units}u</span>
            </div>
            <p className="mt-4 text-sm text-slate-600">Low stock threshold: {record?.low_stock_threshold ?? 2} units</p>
            <div className="mt-5 flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => updateUnits(record?.id ?? '', -1)} disabled={!record}>-</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => updateUnits(record?.id ?? '', 1)} disabled={!record}>+</Button>
            </div>
            {low && <p className="mt-3 text-sm font-semibold text-blood">Low stock — take action</p>}
          </div>
        )
      })}
    </div>
  )
}
