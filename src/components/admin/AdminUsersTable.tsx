'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, Search, ShieldOff, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
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
import type { Profile, UserRole } from '@/types'

const ROLES: UserRole[] = [
  'donor',
  'patient',
  'hospital_staff',
  'blood_bank_admin',
  'admin',
]

const PAGE_SIZE = 20

interface AdminUsersTableProps {
  initialUsers: Profile[]
}

export function AdminUsersTable({ initialUsers }: AdminUsersTableProps) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [page, setPage] = useState(1)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!q) return true
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.student_id ?? '').toLowerCase().includes(q)
      )
    })
  }, [users, query, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const patchUser = async (id: string, body: Record<string, unknown>) => {
    setPendingId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Update failed')
      }
      const data = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)))
      toast.success('User updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setPendingId(null)
    }
  }

  const deleteUser = (id: string, name: string) => {
    startTransition(async () => {
      setPendingId(id)
      try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Delete failed')
        }
        setUsers((prev) => prev.filter((u) => u.id !== id))
        toast.success(`Deleted ${name}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      } finally {
        setPendingId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, or student ID"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Role</span>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | 'all')
              setPage(1)
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Blood</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No users match your filters.
                </TableCell>
              </TableRow>
            ) : (
              pageUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <select
                      value={u.role}
                      disabled={pendingId === u.id}
                      onChange={(e) => patchUser(u.id, { role: e.target.value })}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    {u.blood_type ? <BloodTypeBadge bloodType={u.blood_type} size="sm" /> : '—'}
                  </TableCell>
                  <TableCell className="text-xs">{u.present_district ?? '—'}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => patchUser(u.id, { is_verified: !u.is_verified })}
                      disabled={pendingId === u.id}
                      aria-label={u.is_verified ? 'Unverify user' : 'Verify user'}
                    >
                      <Badge
                        variant={u.is_verified ? 'default' : 'secondary'}
                        className={u.is_verified ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {u.is_verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pendingId === u.id}
                        onClick={() =>
                          patchUser(u.id, {
                            is_available: !u.is_available,
                            is_eligible: !u.is_available,
                          })
                        }
                        title={u.is_available ? 'Deactivate' : 'Reactivate'}
                      >
                        {pendingId === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldOff className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <DeleteUserDialog
                        name={u.full_name || u.email}
                        onConfirm={() => deleteUser(u.id, u.full_name || u.email)}
                        pending={pendingId === u.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </Button>
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function DeleteUserDialog({
  name,
  onConfirm,
  pending,
}: {
  name: string
  onConfirm: () => void
  pending: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" disabled={pending}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete user?</DialogTitle>
          <DialogDescription>
            This will permanently remove <strong>{name}</strong> and all their
            related data. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
            disabled={pending}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
