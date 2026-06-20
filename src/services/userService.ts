import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@/types'

export async function getUser(
  client: SupabaseClient,
  userId: string
): Promise<User> {
  // SWAP POINT: replace with fetch(`https://api.zuzatech.com/users/${userId}`)
  const { data, error } = await client
    .from('users')
    .select('*, role:user_role(*)')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateUser(
  client: SupabaseClient,
  userId: string,
  updates: Partial<Pick<User, 'full_name' | 'avatar_url' | 'phone_number'>>
): Promise<User> {
  // SWAP POINT: replace with fetch(`https://api.zuzatech.com/users/${userId}`, { method: 'PATCH', body: ... })
  const { data, error } = await client
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*, role:user_role(*)')
    .single()
  if (error) throw error
  return data
}
