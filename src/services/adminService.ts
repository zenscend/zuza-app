import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

export interface AdminAllowlistEntry {
  email: string
  role: UserRole
  created_at: string
}

export async function getAllowlist(client: SupabaseClient): Promise<AdminAllowlistEntry[]> {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/admin/allowlist')
  const { data, error } = await client
    .from('admin_allowlist')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addToAllowlist(
  client: SupabaseClient,
  email: string,
  role: Extract<UserRole, 'admin' | 'super_admin'>
): Promise<AdminAllowlistEntry> {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/admin/allowlist', { method: 'POST', ... })
  const { data, error } = await client
    .from('admin_allowlist')
    .insert({ email: email.toLowerCase().trim(), role })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeFromAllowlist(client: SupabaseClient, email: string): Promise<void> {
  // SWAP POINT: replace with fetch(`https://api.zuzatech.com/admin/allowlist/${email}`, { method: 'DELETE' })
  const { error } = await client
    .from('admin_allowlist')
    .delete()
    .eq('email', email.toLowerCase().trim())
  if (error) throw error
}
