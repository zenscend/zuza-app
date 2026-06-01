import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { jwtVerify } from 'jose'
import {
  renderConfirmEmail,
  renderMagicLinkEmail,
  renderPasswordResetEmail,
} from '@/lib/renderEmail'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@zuzatech.com'

// Supabase Auth Hooks authenticate via JWT Bearer token in the
// Authorization header, signed with HS256 using the hook secret.
// Secret format: "v1,whsec_<base64>" — strip prefix, decode to raw bytes.
async function verifyHookJwt(request: Request): Promise<boolean> {
  const raw = process.env.SUPABASE_AUTH_HOOK_SECRET ?? ''
  if (!raw) return true // skip verification in local dev if secret not set

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return false

  try {
    const keyBytes = Buffer.from(raw.replace(/^v1,whsec_/, ''), 'base64')
    await jwtVerify(token, keyBytes)
    return true
  } catch {
    return false
  }
}

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
  if (!(await verifyHookJwt(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
