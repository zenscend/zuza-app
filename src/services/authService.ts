import type { SupabaseClient } from '@supabase/supabase-js'

export async function signInWithPassword(
  client: SupabaseClient,
  email: string,
  password: string
) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/sign-in', { method: 'POST', body: ... })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithPassword(
  client: SupabaseClient,
  email: string,
  password: string,
  fullName: string
) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/sign-up', { method: 'POST', body: ... })
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
  return data
}

export async function signInWithGoogle(client: SupabaseClient) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/google')
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function sendMagicLink(client: SupabaseClient, email: string) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/magic-link', { method: 'POST', body: ... })
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })
  if (error) throw error
}

export async function signOut(client: SupabaseClient) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/sign-out', { method: 'POST' })
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export async function getSession(client: SupabaseClient) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/session')
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session
}

export async function getCurrentUser(client: SupabaseClient) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/me')
  const { data, error } = await client.auth.getUser()
  if (error) return null
  return data.user
}
