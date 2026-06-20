'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserRoleSelect } from './UserRoleSelect'
import { InviteForm } from './InviteForm'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import type { User, UserRole } from '@/types'

interface UserWithEmail extends User {
  email?: string
}

export default function AdminUsersPage() {
  const [users, setUsers]           = useState<UserWithEmail[]>([])
  const [allRoles, setAllRoles]     = useState<UserRole[]>([])
  const [callerRole, setCallerRole] = useState<string>('')
  const [loading, setLoading]       = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Current user's role
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: me } = await supabase
        .from('users')
        .select('*, role:user_role(*)')
        .eq('id', user.id)
        .single()

      setCallerRole((me?.role as UserRole | null)?.name ?? '')

      // All users with their roles
      const { data: userRows } = await supabase
        .from('users')
        .select('*, role:user_role(*)')
        .order('created_at', { ascending: false })

      // All role options
      const { data: roleRows } = await supabase
        .from('user_role')
        .select('*')
        .order('name')

      setAllRoles((roleRows as UserRole[]) ?? [])

      // Merge emails from auth session metadata where possible
      // (only available for the current user client-side; others show '—')
      setUsers((userRows as UserWithEmail[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Loading users…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage team members and their roles</p>
        </div>
        <Button onClick={() => setShowInvite(true)} disabled={showInvite}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite user
        </Button>
      </div>

      {showInvite && (
        <InviteForm
          callerRole={callerRole}
          allRoles={allRoles}
          onClose={() => setShowInvite(false)}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium">{u.full_name ?? '—'}</p>
                  </TableCell>
                  <TableCell>
                    <UserRoleSelect
                      userId={u.id}
                      currentRoleId={u.user_role_id}
                      currentRoleName={(u.role as UserRole | undefined)?.name ?? '—'}
                      callerRole={callerRole}
                      allRoles={allRoles}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('en-ZA', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
