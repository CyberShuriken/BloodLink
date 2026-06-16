'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfileCompleteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service if needed
    console.error('[ProfileComplete Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 py-10 px-4 flex items-center justify-center">
      <Card className="w-full max-w-md border-red-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <CardTitle className="text-2xl font-display text-red-900">
            Profile Setup Failed
          </CardTitle>
          <CardDescription className="text-base mt-2">
            We encountered an issue while setting up your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            This usually happens due to a temporary server issue. Please try again, or contact support if the problem persists.
          </p>

          {error.digest && (
            <div className="bg-slate-100 rounded p-3 text-xs text-slate-700 break-all">
              <strong>Error ID:</strong> {error.digest}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={reset}
              className="w-full bg-blood hover:bg-blood/90"
            >
              Try Again
            </Button>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-500 text-center">
            If you continue to experience issues, please{' '}
            <a
              href="mailto:support@bloodlink.local"
              className="text-blood hover:underline font-medium"
            >
              contact support
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
