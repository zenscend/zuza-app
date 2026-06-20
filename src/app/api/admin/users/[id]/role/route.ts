import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/services/userService'
import { ROLE } from '@/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify caller is Admin or Super Admin
  const supabase = await createClient()
  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const callerProfile = await getUser(supabase, caller.id)
  const callerRole = callerProfile.role?.name
  if (callerRole !== ROLE.ADMIN && callerRole !== ROLE.SUPER_ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { roleId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { roleId } = body
  if (!roleId) return NextResponse.json({ error: 'roleId is required' }, { status: 400 })

  const admin = createAdminClient()

  // Look up target role name to enforce ceiling
  const { data: roleRow, error: roleError } = await admin
    .from('user_role')
    .select('name')
    .eq('id', roleId)
    .single()

  if (roleError || !roleRow) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const targetRoleName = roleRow.name as string

  // Admins can only assign Field Agent; Super Admins can assign anything
  if (callerRole === ROLE.ADMIN && targetRoleName !== ROLE.FIELD_AGENT) {
    return NextResponse.json({ error: 'You cannot assign this role' }, { status: 403 })
  }

  const { error } = await admin
    .from('users')
    .update({ user_role_id: roleId, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ updated: true })
}
