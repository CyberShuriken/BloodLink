import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { user_ids, title, message, type, link } = await req.json()
  const supabase = createClient()
  const rows = (user_ids as string[]).map(id => ({ user_id: id, title, message, type, link }))
  const { error } = await supabase.from('notifications').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
