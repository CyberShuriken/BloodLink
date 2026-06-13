'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Flag, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { BloodRequest, UrgencyLevel, RequestStatus, BloodType } from '@/types'

const URGENCIES: (UrgencyLevel | 'all')[] = ['all', 'critical', 'urgent', 'normal']
const STATUSES: (RequestStatus | 'all')[] = ['all', 'open', 'fulfilled', 'cancelled', 'expired']

interface AdminRequestsTableProps {
  initialRequests: BloodRequest[]
}

export function AdminRequestsTable({ initialRequests }: AdminRequestsTableProps) {
  const [requests, setRequests] = useState<BloodRequest[]>(initialRequests)
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [bloodFilter, setBloodFilter] = useState<BloodType | 'all'>('all')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) return false
        if (statusFilter !== 'all' && r.status !== statusFilter) return false
        if (bloodFilter !== 'all' && r.blood_type !== bloodFilter) return false
        return true
      }),
    [requests, urgencyFilter, statusFilter, bloodFilter]
  )

  const patchRequest = async (id: string, body: Record<string, unknown>) => {
    setPendingId(id)
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Update failed')
      }
      const data = await res.json()
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data.request } : r))
      )
      toast.success('Request updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <FilterSelect
          label="Urgency"
          value={urgencyFilter}
          onChange={setUrgencyFilter}
          options={URGENCIES}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUSES}
        />
        <FilterSelect
          label="Blood"
          value={bloodFilter}
          onChange={(v) => setBloodFilter(v as BloodType | 'all')}
          options={['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
        />
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Hospital</TableHead>
              <TableHead>Blood</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No requests match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/requests/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-slate-900 hover:text-blood hover:underline"
                    >
                      {r.hospital_name}
                    </a>
                  </TableCell>
                  <TableCell>
                    <BloodTypeBadge bloodType={r.blood_type} size="sm" />
                  </TableCell>
                  <TableCell>
                    <UrgencyBadge urgency={r.urgency} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        r.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : r.status === 'cancelled' || r.status === 'expired'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{r.district}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(r.created_at))} ago
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <FlagDialog
                        onConfirm={(reason) =>
                          startTransition(() => patchRequest(r.id, { flag: reason }))
                        }
                        pending={pendingId === r.id}
                      />
                      {r.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          disabled={pendingId === r.id}
                          onClick={() => {
                            if (confirm(`Force-close request at ${r.hospital_name}?`)) {
                              patchRequest(r.id, { status: 'cancelled' })
                            }
                          }}
                        >
                          {pendingId === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: T[]
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

function FlagDialog({
  onConfirm,
  pending,
}: {
  onConfirm: (reason: string) => void
  pending: boolean
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" title="Flag" disabled={pending}>
          <Flag className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flag request</DialogTitle>
          <DialogDescription>
            Add a short note explaining the issue. It will be visible to admins on the
            request detail.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="e.g. duplicate of #abc123"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!reason.trim()) {
                toast.error('Please enter a reason')
                return
              }
              onConfirm(reason.trim())
              setOpen(false)
              setReason('')
            }}
            disabled={pending || !reason.trim()}
          >
            Flag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
