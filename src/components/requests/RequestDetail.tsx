'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, parseISO, format } from 'date-fns'
import { MapPin, Phone, Clock, Users, Loader2, Share2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { BloodRequest, DonorResponse, Profile } from '@/types'

interface RequestDetailProps {
  request: BloodRequest
  responses: DonorResponse[]
  currentUser: Profile | null
  hasResponded: boolean
}

export function RequestDetail({ request, responses, currentUser, hasResponded }: RequestDetailProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [alreadyResponded, setAlreadyResponded] = useState(hasResponded)

  const isOwner = currentUser?.id === request.requester_id
  const canRespond =
    currentUser &&
    !isOwner &&
    !alreadyResponded &&
    currentUser.is_eligible &&
    currentUser.is_available &&
    request.status === 'open'

  const handleRespond = async () => {
    if (!currentUser) { router.push('/login'); return }
    setIsSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase.from('donor_responses').insert({
      request_id: request.id,
      donor_id: currentUser.id,
      message: message.trim() || null,
      status: 'pending',
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Response submitted! The requester will be notified.')
      setAlreadyResponded(true)
      setOpen(false)
      router.refresh()
    }
    setIsSubmitting(false)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: 'Blood Request - BloodLink', url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  const urgencyIsCritical = request.urgency === 'critical'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className={`rounded-2xl border p-6 space-y-4 ${urgencyIsCritical ? 'border-blood bg-red-50' : 'bg-white'}`}>
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <UrgencyBadge urgency={request.urgency} />
              {urgencyIsCritical && (
                <span className="flex items-center gap-1 text-xs text-blood font-medium pulse-ring">
                  <span className="h-2 w-2 rounded-full bg-blood" /> Live Emergency
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{request.hospital_name}</h1>
          </div>
          <BloodTypeBadge bloodType={request.blood_type} size="lg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="h-4 w-4 text-blood shrink-0" />
            {request.hospital_address}, {request.district}, {request.division}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="h-4 w-4 text-blood shrink-0" />
            {currentUser ? (
              <a href={`tel:${request.contact_number}`} className="text-blood hover:underline font-medium">
                {request.contact_number}
              </a>
            ) : (
              <span className="blur-sm select-none">+88 01XXXXXXXXX</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-4 w-4 text-blood shrink-0" />
            Posted {formatDistanceToNow(parseISO(request.created_at))} ago
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="h-4 w-4 text-blood shrink-0" />
            {request.units_fulfilled}/{request.units_needed} units fulfilled
          </div>
        </div>

        {request.needed_before && (
          <p className="text-sm font-medium text-blood">
            ⏰ Needed before: {format(parseISO(request.needed_before), 'dd MMM yyyy, h:mm a')}
          </p>
        )}

        {request.description && (
          <p className="text-sm text-slate-700 bg-white/70 rounded-lg p-3 border">{request.description}</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          {/* Respond button */}
          {!currentUser && (
            <Button onClick={() => router.push('/login')} className="blood-gradient text-white gap-2">
              Sign in to Respond
            </Button>
          )}

          {currentUser && !isOwner && (
            alreadyResponded ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                You have responded
              </div>
            ) : !canRespond ? (
              <Button disabled variant="outline">
                {!currentUser.is_eligible
                  ? 'Not eligible (cooldown)'
                  : !currentUser.is_available
                  ? 'Set yourself available first'
                  : request.status !== 'open'
                  ? 'Request closed'
                  : 'Cannot respond'}
              </Button>
            ) : (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="blood-gradient text-white gap-2">
                    🩸 Respond as Donor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Your Response</DialogTitle>
                    <DialogDescription>
                      You are responding to donate{' '}
                      <strong>{request.blood_type}</strong> blood at{' '}
                      <strong>{request.hospital_name}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="rounded-lg bg-slate-50 border p-3 text-sm text-slate-700 space-y-1">
                      <p>Your blood type: <strong>{currentUser.blood_type ?? 'Not set'}</strong></p>
                      <p>Eligibility: <strong className="text-green-700">Eligible ✓</strong></p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="response-message">Message (optional)</Label>
                      <Textarea
                        id="response-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. I can arrive within 2 hours..."
                        maxLength={300}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRespond}
                        className="flex-1 blood-gradient text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Confirm Response
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )
          )}

          <Button variant="outline" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Responses */}
      {(isOwner || responses.length > 0) && (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-display font-bold text-lg mb-4">
            Donor Responses ({responses.length})
          </h2>
          {responses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No responses yet.</p>
          ) : (
            <div className="space-y-3">
              {responses.map((resp) => (
                <div key={resp.id} className="flex items-center gap-3 rounded-xl border p-4">
                  <div className="h-10 w-10 rounded-full blood-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {resp.profiles?.full_name?.split(' ').map((n) => n[0]).join('') ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{resp.profiles?.full_name ?? 'Anonymous Donor'}</p>
                    {resp.profiles?.blood_type && (
                      <BloodTypeBadge bloodType={resp.profiles.blood_type} size="sm" />
                    )}
                    {resp.message && (
                      <p className="text-xs text-muted-foreground mt-1">{resp.message}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    resp.status === 'completed' ? 'bg-green-100 text-green-700' :
                    resp.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                    resp.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {resp.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
