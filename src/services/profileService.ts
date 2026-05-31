import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export async function getProfile(
  client: SupabaseClient,
  userId: string
): Promise<Profile> {
  // SWAP POINT: replace with fetch(`https://api.zuzatech.com/profiles/${userId}`)
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'phone_number'>>
): Promise<Profile> {
  // SWAP POINT: replace with fetch(`https://api.zuzatech.com/profiles/${userId}`, { method: 'PATCH', body: ... })
  const { data, error } = await client
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}
