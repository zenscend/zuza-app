import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createHmac } from 'crypto'
import {
  renderConfirmEmail,
  renderMagicLinkEmail,
  renderPasswordResetEmail,
} from '@/lib/renderEmail'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@zuzatech.com'

// Supabase Auth Hook secrets are in the format "v1,whsec_<base64>"
// Strip the prefix and base64-decode to get the raw key bytes.
function getRawSecret(): Buffer | null {
  const raw = process.env.SUPABASE_AUTH_HOOK_SECRET ?? ''
  if (!raw) return null
  const base64 = raw.replace(/^v1,whsec_/, '')
  return Buffer.from(base64, 'base64')
}

async function verifySignature(request: Request, body: string): Promise<boolean> {
  const key = getRawSecret()
  if (!key) return true // no secret configured — skip in local dev
  const signature = request.headers.get('x-supabase-signature')
  if (!signature) return false
  const expected = createHmac('sha256', key).update(body).digest('hex')
  return signature === expected
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
  const rawBody = await request.text()

  if (!(await verifySignature(request, rawBody))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: HookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { user, email_data } = payload
  const { email_action_type, token_hash, site_url, redirect_to } = email_data
  const name   = user.user_metadata?.full_name
  const to     = user.email
  const base   = site_url || process.env.NEXT_PUBLIC_APP_URL || 'https://app.zuzatech.com'
  const next   = redirect_to || '/dashboard'

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
      // email_change and unknown types — acknowledge without sending
      return NextResponse.json({ message: 'ok' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: FROM, to, subject, html })
    return NextResponse.json({ message: 'ok' })

  } catch (err) {
    console.error('[email/auth] delivery failed:', err)
    // Return 200 so Supabase doesn't retry — failure is logged server-side
    return NextResponse.json({ message: 'ok', warning: 'email delivery failed' })
  }
}
