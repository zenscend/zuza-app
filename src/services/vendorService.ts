import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vendor, CreateVendorInput, VendorStatus } from '@/types'

export async function createVendor(
  client: SupabaseClient,
  input: CreateVendorInput
): Promise<Vendor> {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/vendors', { method: 'POST', body: ... })
  const { data, error } = await client
    .from('vendors')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getVendors(
  client: SupabaseClient,
  filters?: { status?: VendorStatus }
): Promise<Vendor[]> {
  // SWAP POINT: replace with fetch(`https://api.zuzatech.com/vendors?${new URLSearchParams(filters)}`)
  let query = client.from('vendors').select('*').order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getVendorById(
  client: SupabaseClient,
  id: string
): Promise<Vendor> {
  // SWAP POINT: replace with fetch(`https://api.zuzatech.com/vendors/${id}`)
  const { data, error } = await client
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateVendorStatus(
  client: SupabaseClient,
  id: string,
  status: VendorStatus
): Promise<Vendor> {
  // SWAP POINT: replace with fetch(`https://api.zuzatech.com/vendors/${id}/status`, { method: 'PATCH', body: ... })
  const { data, error } = await client
    .from('vendors')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
