import type { SupabaseClient } from '@supabase/supabase-js'

// Maps Supabase raw error messages to user-friendly ones
export function friendlyAuthError(message: string): string {
  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials'))
    return 'Email or password is incorrect.'
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed'))
    return 'Please confirm your email address before signing in.'
  if (message.includes('over_email_send_rate_limit') || message.includes('rate limit'))
    return 'Too many attempts — please wait a minute and try again.'
  if (message.includes('User already registered') || message.includes('user_already_exists'))
    return 'An account with this email already exists. Try signing in instead.'
  if (message.includes('Password should be at least'))
    return 'Password must be at least 8 characters.'
  if (message.includes('Unable to validate email address'))
    return 'Please enter a valid email address.'
  return message
}

export async function signInWithPassword(
  client: SupabaseClient,
  email: string,
  password: string
) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/sign-in')
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(friendlyAuthError(error.message))
  return data
}

export async function signUpWithPassword(
  client: SupabaseClient,
  email: string,
  password: string,
  fullName: string
) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/sign-up')
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw new Error(friendlyAuthError(error.message))
  return data
}

export async function resendConfirmation(client: SupabaseClient, email: string) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/resend-confirmation')
  const { error } = await client.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.zuzatech.com')}/api/auth/callback`,
    },
  })
  if (error) throw new Error(friendlyAuthError(error.message))
}

export async function signInWithGoogle(client: SupabaseClient) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/google')
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.zuzatech.com')}/api/auth/callback`,
    },
  })
  if (error) throw new Error(friendlyAuthError(error.message))
  return data
}

export async function sendMagicLink(client: SupabaseClient, email: string) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/magic-link')
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.zuzatech.com')}/api/auth/callback`,
    },
  })
  if (error) throw new Error(friendlyAuthError(error.message))
}

export async function signOut(client: SupabaseClient) {
  // SWAP POINT: replace with fetch('https://api.zuzatech.com/auth/sign-out')
  const { error } = await client.auth.signOut()
  if (error) throw new Error(friendlyAuthError(error.message))
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
