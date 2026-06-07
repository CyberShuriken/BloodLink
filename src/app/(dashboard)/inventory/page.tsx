import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InventoryBoard } from '@/components/inventory/InventoryBoard'
import { EmptyState } from '@/components/shared/EmptyState'
import type { BloodInventory, Profile } from '@/types'

export default async function InventoryPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  if (profile.role !== 'hospital_staff' && profile.role !== 'blood_bank_admin') {
    return <EmptyState message="Inventory access is reserved for hospitals and blood banks." />
  }

  const { data: inventoryData } = await supabase
    .from('blood_inventory')
    .select('*')
    .order('blood_type', { ascending: true })

  const records = (inventoryData ?? []) as BloodInventory[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Blood Inventory</h1>
        <p className="mt-2 text-sm text-slate-600">Track stock levels for all blood types and update unit counts quickly.</p>
      </div>
      <InventoryBoard records={records} />
    </div>
  )
}
