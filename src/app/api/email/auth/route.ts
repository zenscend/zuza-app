import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  renderConfirmEmail,
  renderMagicLinkEmail,
  renderPasswordResetEmail,
} from '@/lib/renderEmail'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@zuzatech.com'

// TODO: add JWT verification once emails are confirmed working
// Supabase sends Authorization: Bearer <jwt> signed with the hook secret

interface HookPayload {
  user: {
    email: string
    user_metadata?: { full_name?: string }
  }
  email_data: {
    email_action_type: 'signup' | 'magiclink' | 'recovery' | 'email_change' | 'invite'
    token: string
    token_hash: string
    redirect_to: string
    site_url: string
  }
}

export async function POST(request: Request) {
  let payload: HookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { user, email_data } = payload
  const { email_action_type, token_hash, site_url, redirect_to } = email_data
  const name = user.user_metadata?.full_name
  const to   = user.email
  const base = site_url || process.env.NEXT_PUBLIC_APP_URL || 'https://app.zuzatech.com'
  const next = redirect_to || '/dashboard'

  try {
    let subject: string
    let html: string

    if (email_action_type === 'signup' || email_action_type === 'invite') {
      const url = `${base}/api/auth/callback?token_hash=${token_hash}&type=${email_action_type}&next=${next}`
      subject = 'Confirm your Zuza account'
      html = await renderConfirmEmail(name, url)

    } else if (email_action_type === 'magiclink') {
      const url = `${base}/api/auth/callback?token_hash=${token_hash}&type=magiclink&next=${next}`
      subject = 'Your Zuza sign-in link'
      html = await renderMagicLinkEmail(name, url)

    } else if (email_action_type === 'recovery') {
      const url = `${base}/api/auth/callback?token_hash=${token_hash}&type=recovery&next=/reset-password`
      subject = 'Reset your Zuza password'
      html = await renderPasswordResetEmail(name, url)

    } else {
      return NextResponse.json({ message: 'ok' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: FROM, to, subject, html })
    return NextResponse.json({ message: 'ok' })

  } catch (err) {
    console.error('[email/auth] delivery failed:', err)
    return NextResponse.json({ message: 'ok', warning: 'email delivery failed' })
  }
}
