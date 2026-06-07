'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { profileCompleteSchema, type ProfileCompleteInput } from '@/lib/validations'
import { DEPARTMENTS, DIVISIONS_DISTRICTS, BLOOD_TYPES } from '@/lib/constants'
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
import type { Profile } from '@/types'

const DIVISIONS = Object.keys(DIVISIONS_DISTRICTS)

const CURRENT_YEAR = new Date().getFullYear()
const BATCH_YEARS = Array.from({ length: 8 }, (_, i) => String(CURRENT_YEAR - i))

interface ProfileCompleteFormProps {
  profile: Profile
}

export function ProfileCompleteForm({ profile }: ProfileCompleteFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url ?? null)
  const [sameAsPresent, setSameAsPresent] = useState(false)
  const [bioLength, setBioLength] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ProfileCompleteInput>({
    resolver: zodResolver(profileCompleteSchema),
    defaultValues: {
      student_id: profile.student_id ?? '',
      department: profile.department ?? '',
      batch: profile.batch ?? '',
      contact_number: profile.contact_number ?? '',
      blood_type: profile.blood_type ?? undefined,
      present_address: profile.present_address ?? '',
      present_district: profile.present_district ?? '',
      present_division: (profile.present_division as ProfileCompleteInput['present_division']) ?? undefined,
      permanent_address: profile.permanent_address ?? '',
      permanent_district: profile.permanent_district ?? '',
      permanent_division: (profile.permanent_division as ProfileCompleteInput['permanent_division']) ?? undefined,
      bio: profile.bio ?? '',
    },
  })

  const presentDivision = watch('present_division')
  const presentDistricts = presentDivision ? DIVISIONS_DISTRICTS[presentDivision] ?? [] : []
  const permanentDivision = watch('permanent_division')
  const permanentDistricts = permanentDivision ? DIVISIONS_DISTRICTS[permanentDivision] ?? [] : []
  const presentAddress = watch('present_address')
  const presentDistrict = watch('present_district')
  const bio = watch('bio')

  useEffect(() => {
    setBioLength(bio?.length ?? 0)
  }, [bio])

  useEffect(() => {
    if (sameAsPresent) {
      setValue('permanent_address', watch('present_address') ?? '')
      setValue('permanent_district', watch('present_district') ?? '')
      setValue('permanent_division', watch('present_division') ?? undefined)
    }
  }, [sameAsPresent, setValue, watch, presentAddress, presentDistrict, presentDivision])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP allowed')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const goNext = async () => {
    const fieldsStep1: (keyof ProfileCompleteInput)[] = ['student_id', 'department', 'batch', 'blood_type', 'contact_number']
    const fieldsStep2: (keyof ProfileCompleteInput)[] = ['present_address', 'present_district', 'present_division', 'permanent_address', 'permanent_district', 'permanent_division']

    const valid = await trigger(step === 1 ? fieldsStep1 : fieldsStep2)
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = async (values: ProfileCompleteInput) => {
    const supabase = createClient()

    let avatarUrl = profile.avatar_url ?? null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${profile.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })
      if (uploadError) {
        toast.error('Failed to upload avatar: ' + uploadError.message)
        return
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl = urlData.publicUrl
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...values,
        avatar_url: avatarUrl,
        is_profile_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      toast.error('Failed to save profile: ' + error.message)
      return
    }

    toast.success('Profile complete! Welcome to BloodLink 🎉')
    router.push('/dashboard')
    router.refresh()
  }

  const totalSteps = 3

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Step {step} of {totalSteps}</span>
          <span className="text-sm text-muted-foreground">
            {step === 1 ? 'Basic Info' : step === 2 ? 'Address' : 'Final Details'}
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
          {/* ── Step 1: Basic Info ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold">Tell us about yourself</h2>
                <p className="text-muted-foreground text-sm mt-1">Your student details help us match you with the right requests.</p>
              </div>

              {/* Avatar upload */}
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-dashed border-blood/30 bg-blood-muted flex items-center justify-center">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-blood/50" />
                  )}
                </div>
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer text-sm text-blood font-medium hover:underline">
                    {avatarPreview ? 'Change photo' : 'Upload profile photo'}
                  </Label>
                  <p className="text-xs text-muted-foreground">JPEG, PNG up to 2MB</p>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="student_id">Student ID *</Label>
                  <Input id="student_id" {...register('student_id')} placeholder="e.g. 2021-01-001" />
                  {errors.student_id && <p className="text-xs text-destructive">{errors.student_id.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_number">Phone Number *</Label>
                  <Input id="contact_number" {...register('contact_number')} placeholder="01XXXXXXXXX" />
                  {errors.contact_number && <p className="text-xs text-destructive">{errors.contact_number.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department">Department *</Label>
                <Select
                  onValueChange={(v) => setValue('department', v, { shouldValidate: true })}
                  defaultValue={watch('department')}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="batch">Batch Year *</Label>
                  <Select
                    onValueChange={(v) => setValue('batch', v, { shouldValidate: true })}
                    defaultValue={watch('batch')}
                  >
                    <SelectTrigger id="batch">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {BATCH_YEARS.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.batch && <p className="text-xs text-destructive">{errors.batch.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Blood Type *</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BLOOD_TYPES.map((bt) => {
                      const selected = watch('blood_type') === bt
                      return (
                        <button
                          key={bt}
                          type="button"
                          onClick={() => setValue('blood_type', bt, { shouldValidate: true })}
                          className={`rounded-lg border py-2 text-sm font-bold transition-all ${
                            selected
                              ? 'blood-gradient text-white border-blood shadow'
                              : 'border-input hover:border-blood hover:text-blood'
                          }`}
                          aria-pressed={selected}
                        >
                          {bt}
                        </button>
                      )
                    })}
                  </div>
                  {errors.blood_type && <p className="text-xs text-destructive">{errors.blood_type.message}</p>}
                </div>
              </div>

              <Button type="button" onClick={goNext} className="w-full blood-gradient text-white">
                Continue →
              </Button>
            </div>
          )}

          {/* ── Step 2: Address ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold">Your Address</h2>
                <p className="text-muted-foreground text-sm mt-1">We use this to match you with nearby blood requests.</p>
              </div>

              <fieldset className="space-y-4">
                <legend className="font-semibold text-sm uppercase tracking-wide text-slate-600">Present Address</legend>
                <div className="space-y-1.5">
                  <Label htmlFor="present_address">Street / Area *</Label>
                  <Textarea
                    id="present_address"
                    {...register('present_address')}
                    placeholder="House no., Road, Area..."
                    rows={2}
                  />
                  {errors.present_address && <p className="text-xs text-destructive">{errors.present_address.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Division *</Label>
                    <Select
                      onValueChange={(v) => {
                        setValue('present_division', v as ProfileCompleteInput['present_division'], { shouldValidate: true })
                        setValue('present_district', '')
                      }}
                      defaultValue={watch('present_division')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Division" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.present_division && <p className="text-xs text-destructive">{errors.present_division.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>District *</Label>
                    <Select
                      onValueChange={(v) => setValue('present_district', v, { shouldValidate: true })}
                      defaultValue={watch('present_district')}
                      disabled={!presentDivision}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="District" />
                      </SelectTrigger>
                      <SelectContent>
                        {presentDistricts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.present_district && <p className="text-xs text-destructive">{errors.present_district.message}</p>}
                  </div>
                </div>
              </fieldset>

              {/* Same as present */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPresent}
                  onChange={(e) => setSameAsPresent(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-blood"
                />
                <span className="text-sm">Permanent address same as present address</span>
              </label>

              {!sameAsPresent && (
                <fieldset className="space-y-4">
                  <legend className="font-semibold text-sm uppercase tracking-wide text-slate-600">Permanent Address</legend>
                  <div className="space-y-1.5">
                    <Label htmlFor="permanent_address">Street / Area *</Label>
                    <Textarea
                      id="permanent_address"
                      {...register('permanent_address')}
                      placeholder="House no., Road, Area..."
                      rows={2}
                    />
                    {errors.permanent_address && <p className="text-xs text-destructive">{errors.permanent_address.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Division *</Label>
                      <Select
                        onValueChange={(v) => {
                          setValue('permanent_division', v as ProfileCompleteInput['permanent_division'], { shouldValidate: true })
                          setValue('permanent_district', '')
                        }}
                        defaultValue={watch('permanent_division')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Division" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.permanent_division && <p className="text-xs text-destructive">{errors.permanent_division.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>District *</Label>
                      <Select
                        onValueChange={(v) => setValue('permanent_district', v, { shouldValidate: true })}
                        defaultValue={watch('permanent_district')}
                        disabled={!permanentDivision}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="District" />
                        </SelectTrigger>
                        <SelectContent>
                          {permanentDistricts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.permanent_district && <p className="text-xs text-destructive">{errors.permanent_district.message}</p>}
                    </div>
                  </div>
                </fieldset>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  ← Back
                </Button>
                <Button type="button" onClick={goNext} className="flex-1 blood-gradient text-white">
                  Continue →
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Bio & Submit ───────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold">Almost done!</h2>
                <p className="text-muted-foreground text-sm mt-1">Add a brief bio to help donors and patients know you better.</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <span className={`text-xs ${bioLength > 280 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {bioLength}/300
                  </span>
                </div>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  placeholder="Tell others why you donate blood and a bit about yourself..."
                  rows={4}
                  maxLength={300}
                />
                {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-slate-50 border p-4 space-y-2 text-sm">
                <p className="font-semibold text-slate-700">Review your info</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span>Student ID: <strong>{watch('student_id')}</strong></span>
                  <span>Blood Type: <strong>{watch('blood_type')}</strong></span>
                  <span>Department: <strong>{watch('department')}</strong></span>
                  <span>Batch: <strong>{watch('batch')}</strong></span>
                  <span>Division: <strong>{watch('present_division')}</strong></span>
                  <span>District: <strong>{watch('present_district')}</strong></span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                  ← Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 blood-gradient text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                  ) : (
                    'Complete Profile 🎉'
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
