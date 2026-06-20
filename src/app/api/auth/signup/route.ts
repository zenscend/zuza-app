import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderConfirmEmail } from '@/lib/renderEmail'
import { friendlyAuthError } from '@/services/authService'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@zuzatech.com'

export async function POST(request: Request) {
  const origin = new URL(request.url).origin

  let body: { email: string; password?: string; fullName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, password, fullName } = body
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const admin = createAdminClient()

  // Initial signup needs a password to create the account.
  // Resend (no password) generates a magic link — clicking it confirms the email and logs the user in.
  let hashedToken: string
  let tokenType: 'signup' | 'magiclink'

  if (password) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
        redirectTo: `${origin}/api/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      return NextResponse.json({ error: friendlyAuthError(error.message) }, { status: 400 })
    }
    hashedToken = data.properties.hashed_token
    tokenType = 'signup'
  } else {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${origin}/api/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      return NextResponse.json({ error: friendlyAuthError(error.message) }, { status: 400 })
    }
    hashedToken = data.properties.hashed_token
    tokenType = 'magiclink'
  }

  const confirmationUrl = `${origin}/api/auth/callback?token_hash=${hashedToken}&type=${tokenType}&next=/dashboard`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const html = await renderConfirmEmail(fullName, confirmationUrl)
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Confirm your Zuza account',
      html,
    })
  } catch (err) {
    console.error('[api/auth/signup] email delivery failed:', err)
    // Account was created — user can retry resend
  }

  return NextResponse.json({ needsConfirmation: true })
}
