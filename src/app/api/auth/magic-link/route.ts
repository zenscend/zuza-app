import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderMagicLinkEmail } from '@/lib/renderEmail'
import { friendlyAuthError } from '@/services/authService'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@zuzatech.com'

export async function POST(request: Request) {
  const origin = new URL(request.url).origin

  let body: { email: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email } = body
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${origin}/api/auth/callback?next=/dashboard`,
    },
  })

  if (error) {
    return NextResponse.json(
      { error: friendlyAuthError(error.message) },
      { status: 400 }
    )
  }

  const { hashed_token } = data.properties
  const magicLink = `${origin}/api/auth/callback?token_hash=${hashed_token}&type=magiclink&next=/dashboard`

  // Attempt to look up the user's name for personalisation
  let name: string | undefined
  try {
    const { data: userData } = await admin.auth.admin.getUserById(data.user.id)
    name = userData?.user?.user_metadata?.full_name
  } catch { /* optional */ }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const html = await renderMagicLinkEmail(name, magicLink)
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Your Zuza sign-in link',
      html,
    })
  } catch (err) {
    console.error('[api/auth/magic-link] email delivery failed:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
