import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH /api/admin/users/[id]  — update role, verified, or availability
// DELETE /api/admin/users/[id] — hard-delete a profile (admin escape hatch)

const patchSchema = z.object({
  role: z
    .enum(['donor', 'patient', 'hospital_staff', 'blood_bank_admin', 'admin'])
    .optional(),
  is_verified: z.boolean().optional(),
  is_available: z.boolean().optional(),
  is_eligible: z.boolean().optional(),
})

async function requireAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401, message: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { ok: false as const, status: 403, message: 'Admin access required' }
  }
  return { ok: true as const, userId: user.id }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const updates = parsed.data
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Guard: don't let an admin demote themselves and lose access.
  if (params.id === auth.userId && updates.role && updates.role !== 'admin') {
    return NextResponse.json(
      { error: 'You cannot change your own role away from admin' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id, role, is_verified, is_available, is_eligible')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ user: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  if (params.id === auth.userId) {
    return NextResponse.json(
      { error: 'You cannot delete your own account from the admin panel' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').delete().eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
