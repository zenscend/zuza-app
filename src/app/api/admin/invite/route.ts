import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/services/userService'
import { renderInviteEmail } from '@/lib/renderEmail'
import { ROLE } from '@/types'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@zuzatech.com'

export async function POST(request: Request) {
  const origin = new URL(request.url).origin

  // Verify caller is Admin or Super Admin
  const supabase = await createClient()
  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const callerProfile = await getUser(supabase, caller.id)
  const callerRole = callerProfile.role?.name
  if (callerRole !== ROLE.ADMIN && callerRole !== ROLE.SUPER_ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { email: string; roleId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, roleId } = body
  if (!email || !roleId) {
    return NextResponse.json({ error: 'email and roleId are required' }, { status: 400 })
  }

  // Look up the target role to enforce permission ceiling
  const admin = createAdminClient()
  const { data: roleRow, error: roleError } = await admin
    .from('user_role')
    .select('name')
    .eq('id', roleId)
    .single()

  if (roleError || !roleRow) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const targetRoleName = roleRow.name as string

  // Admins can only invite Field Agents; Super Admins can invite Admin or Field Agent
  const adminAllowed = [ROLE.FIELD_AGENT] as string[]
  const superAdminAllowed = [ROLE.FIELD_AGENT, ROLE.ADMIN] as string[]
  const allowed = callerRole === ROLE.SUPER_ADMIN ? superAdminAllowed : adminAllowed

  if (!allowed.includes(targetRoleName)) {
    return NextResponse.json({ error: 'You cannot assign this role' }, { status: 403 })
  }

  // Upsert into allowlist so the trigger assigns the right role on signup
  await admin
    .from('admin_allowlist')
    .upsert({ email: email.toLowerCase().trim(), role_id: roleId }, { onConflict: 'email' })

  // Generate invite link
  const { data, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${origin}/api/auth/callback?next=/set-password`,
    },
  })

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 400 })
  }

  const { hashed_token } = data.properties
  const inviteUrl = `${origin}/api/auth/callback?token_hash=${hashed_token}&type=invite&next=/set-password`

  // Send invite email via Resend
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const html = await renderInviteEmail(undefined, inviteUrl, targetRoleName)
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `You've been invited to Zuza`,
      html,
    })
  } catch (err) {
    console.error('[api/admin/invite] email delivery failed:', err)
    return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 })
  }

  return NextResponse.json({ invited: true })
}
