'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { profileCompleteSchema, type ProfileCompleteInput } from '@/lib/validations'
import { BLOOD_TYPES } from '@/lib/constants'
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

interface ProfileEditFormProps {
  profile: Profile
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url ?? null)
  const [bioLength, setBioLength] = useState(profile.bio?.length ?? 0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
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

  const bio = watch('bio')

  useEffect(() => {
    setBioLength(bio?.length ?? 0)
  }, [bio])

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

    // Do NOT overwrite is_profile_complete — they're already complete if they're here.
    const { error } = await supabase
      .from('profiles')
      .update({
        ...values,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      toast.error('Failed to save: ' + error.message)
      return
    }

    toast.success('Profile updated')
    router.push('/profile')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border bg-white shadow-sm p-6 sm:p-8 space-y-6"
      noValidate
    >
      {/* Avatar */}
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
          <Label htmlFor="avatar-edit" className="cursor-pointer text-sm text-blood font-medium hover:underline">
            {avatarPreview ? 'Change photo' : 'Upload profile photo'}
          </Label>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP up to 2MB</p>
          <input
            id="avatar-edit"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Student ID" id="student_id" error={errors.student_id?.message}>
          <Input id="student_id" {...register('student_id')} />
        </Field>
        <Field label="Phone" id="contact_number" error={errors.contact_number?.message}>
          <Input id="contact_number" {...register('contact_number')} placeholder="01XXXXXXXXX" />
        </Field>
      </div>

      <Field label="Department" id="department" error={errors.department?.message}>
        <Input id="department" {...register('department')} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Batch" id="batch" error={errors.batch?.message}>
          <Input id="batch" {...register('batch')} placeholder="e.g. 2022" />
        </Field>
        <Field label="Blood type" id="blood_type" error={errors.blood_type?.message}>
          <Select
            onValueChange={(v) => setValue('blood_type', v as ProfileCompleteInput['blood_type'], { shouldValidate: true })}
            defaultValue={watch('blood_type')}
          >
            <SelectTrigger id="blood_type">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_TYPES.map((bt) => (
                <SelectItem key={bt} value={bt}>
                  {bt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Present address" id="present_address" error={errors.present_address?.message}>
        <Textarea id="present_address" rows={2} {...register('present_address')} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Present division" id="present_division" error={errors.present_division?.message}>
          <Input id="present_division" {...register('present_division')} />
        </Field>
        <Field label="Present district" id="present_district" error={errors.present_district?.message}>
          <Input id="present_district" {...register('present_district')} />
        </Field>
      </div>

      <Field label="Permanent address" id="permanent_address" error={errors.permanent_address?.message}>
        <Textarea id="permanent_address" rows={2} {...register('permanent_address')} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Permanent division" id="permanent_division" error={errors.permanent_division?.message}>
          <Input id="permanent_division" {...register('permanent_division')} />
        </Field>
        <Field label="Permanent district" id="permanent_district" error={errors.permanent_district?.message}>
          <Input id="permanent_district" {...register('permanent_district')} />
        </Field>
      </div>

      <Field label="Bio" id="bio" error={errors.bio?.message}>
        <Textarea
          id="bio"
          rows={3}
          maxLength={300}
          {...register('bio')}
          placeholder="Tell others about yourself..."
        />
        <p className={`text-xs text-right ${bioLength > 280 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {bioLength}/300
        </p>
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.push('/profile')}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || (!isDirty && !avatarFile)} className="blood-gradient text-white">
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save changes</>
          )}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
