import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH /api/admin/requests/[id]
// Admin-only actions: force-close a request or change its status.
// Flag is stored on description as a suffix (e.g. "[FLAGGED: spam] original text")
// since the spec mentions a flag note but no dedicated flag column.

const patchSchema = z.object({
  status: z
    .enum(['open', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired'])
    .optional(),
  flag: z.string().max(200).optional(),
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
  return { ok: true as const }
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

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (parsed.data.status) updates.status = parsed.data.status
  if (parsed.data.flag) {
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('blood_requests')
      .select('description')
      .eq('id', params.id)
      .single()
    const base = existing?.description ?? ''
    updates.description = `[FLAGGED: ${parsed.data.flag}] ${base}`.slice(0, 1000)
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('blood_requests')
    .update(updates)
    .eq('id', params.id)
    .select('id, status, description')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ request: data })
}
