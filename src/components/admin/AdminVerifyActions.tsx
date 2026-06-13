'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminVerifyActionsProps {
  userId: string
}

export function AdminVerifyActions({ userId }: AdminVerifyActionsProps) {
  const [pending, setPending] = useState(false)

  const updateVerification = async (isVerified: boolean) => {
    setPending(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: isVerified }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Update failed')
      }
      toast.success(isVerified ? 'User verified' : 'Verification revoked')
      // Refresh the route so the queue updates
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-green-700 border-green-300 hover:bg-green-50"
        disabled={pending}
        onClick={() => updateVerification(true)}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
        Verify
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-700 border-red-300 hover:bg-red-50"
        disabled={pending}
        onClick={() => updateVerification(false)}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Reject
      </Button>
    </div>
  )
}
