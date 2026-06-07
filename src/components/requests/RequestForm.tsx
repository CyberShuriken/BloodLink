'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { bloodRequestSchema, type BloodRequestInput } from '@/lib/validations'
import { BLOOD_TYPES, DIVISIONS_DISTRICTS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function RequestForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<BloodRequestInput>({
    resolver: zodResolver(bloodRequestSchema),
    defaultValues: {
      urgency: 'urgent',
      units_needed: 1,
    },
  })

  const division = watch('division')
  const districts = division ? DIVISIONS_DISTRICTS[division] ?? [] : []

  const goNext = async () => {
    const step1Fields: (keyof BloodRequestInput)[] = ['patient_name', 'blood_type', 'units_needed', 'urgency']
    const step2Fields: (keyof BloodRequestInput)[] = ['hospital_name', 'hospital_address', 'district', 'division']
    const valid = await trigger(step === 1 ? step1Fields : step2Fields)
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = async (values: BloodRequestInput) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('blood_requests')
      .insert({
        ...values,
        requester_id: user.id,
        needed_before: values.needed_before || null,
      })
      .select('id')
      .single()

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Blood request posted successfully!')
    router.push(`/requests/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
          <span className="text-sm text-muted-foreground">
            {step === 1 ? 'Patient Info' : step === 2 ? 'Location' : 'Contact & Submit'}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full blood-gradient transition-all duration-500 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold">Patient Information</h2>
                <p className="text-muted-foreground text-sm mt-1">Basic details about the patient in need.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patient_name">Patient Name *</Label>
                <Input id="patient_name" {...register('patient_name')} placeholder="Full name of the patient" />
                {errors.patient_name && <p className="text-xs text-destructive">{errors.patient_name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Blood Type Needed *</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BLOOD_TYPES.map((bt) => {
                      const selected = watch('blood_type') === bt
                      return (
                        <button
                          key={bt}
                          type="button"
                          onClick={() => setValue('blood_type', bt, { shouldValidate: true })}
                          className={`rounded-lg border py-2 text-xs font-bold transition-all ${
                            selected ? 'blood-gradient text-white border-blood shadow' : 'border-input hover:border-blood hover:text-blood'
                          }`}
                        >{bt}</button>
                      )
                    })}
                  </div>
                  {errors.blood_type && <p className="text-xs text-destructive">{errors.blood_type.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="units_needed">Units Needed *</Label>
                  <Input
                    id="units_needed"
                    type="number"
                    min={1}
                    max={10}
                    {...register('units_needed', { valueAsNumber: true })}
                  />
                  {errors.units_needed && <p className="text-xs text-destructive">{errors.units_needed.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Urgency *</Label>
                  <Select
                    defaultValue="urgent"
                    onValueChange={(v) => setValue('urgency', v as 'critical' | 'urgent' | 'normal', { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">🚨 Critical</SelectItem>
                      <SelectItem value="urgent">⚠️ Urgent</SelectItem>
                      <SelectItem value="normal">ℹ️ Normal</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.urgency && <p className="text-xs text-destructive">{errors.urgency.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="needed_before">Needed Before (optional)</Label>
                  <Input
                    id="needed_before"
                    type="datetime-local"
                    {...register('needed_before')}
                  />
                </div>
              </div>

              <Button type="button" onClick={goNext} className="w-full blood-gradient text-white">
                Continue →
              </Button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold">Location Details</h2>
                <p className="text-muted-foreground text-sm mt-1">Where should donors go?</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hospital_name">Hospital Name *</Label>
                <Input id="hospital_name" {...register('hospital_name')} placeholder="Name of the hospital or clinic" />
                {errors.hospital_name && <p className="text-xs text-destructive">{errors.hospital_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hospital_address">Hospital Address *</Label>
                <Textarea id="hospital_address" {...register('hospital_address')} placeholder="Full address of the hospital" rows={2} />
                {errors.hospital_address && <p className="text-xs text-destructive">{errors.hospital_address.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Division *</Label>
                  <Select
                    onValueChange={(v) => {
                      setValue('division', v as BloodRequestInput['division'], { shouldValidate: true })
                      setValue('district', '')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(DIVISIONS_DISTRICTS).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.division && <p className="text-xs text-destructive">{errors.division.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>District *</Label>
                  <Select
                    onValueChange={(v) => setValue('district', v, { shouldValidate: true })}
                    disabled={!division}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                <Button type="button" onClick={goNext} className="flex-1 blood-gradient text-white">Continue →</Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold">Contact & Description</h2>
                <p className="text-muted-foreground text-sm mt-1">How can donors reach you?</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact_number">Contact Number *</Label>
                <Input id="contact_number" {...register('contact_number')} placeholder="01XXXXXXXXX" />
                {errors.contact_number && <p className="text-xs text-destructive">{errors.contact_number.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Additional Details (optional)</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Any additional notes for donors (condition, special requirements...)"
                  rows={3}
                  maxLength={500}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              {/* Review */}
              <div className="rounded-xl bg-slate-50 border p-4 space-y-2 text-xs text-slate-600">
                <p className="font-semibold text-sm text-slate-700">Review</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span>Patient: <strong>{watch('patient_name')}</strong></span>
                  <span>Blood Type: <strong>{watch('blood_type')}</strong></span>
                  <span>Units: <strong>{watch('units_needed')}</strong></span>
                  <span>Urgency: <strong>{watch('urgency')}</strong></span>
                  <span>Hospital: <strong>{watch('hospital_name')}</strong></span>
                  <span>District: <strong>{watch('district')}</strong></span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">← Back</Button>
                <Button type="submit" className="flex-1 blood-gradient text-white" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Posting...</> : 'Post Request 🩸'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
