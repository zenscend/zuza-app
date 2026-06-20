'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE, type UserRole } from '@/types'

interface Props {
  userId: string
  currentRoleId: string
  currentRoleName: string
  callerRole: string
  allRoles: UserRole[]
}

// Roles the caller is allowed to assign
function assignableRoles(callerRole: string, allRoles: UserRole[]): UserRole[] {
  if (callerRole === ROLE.SUPER_ADMIN) {
    return allRoles.filter((r) => r.name !== ROLE.VENDOR)
  }
  // Admins can only assign Field Agent
  return allRoles.filter((r) => r.name === ROLE.FIELD_AGENT)
}

export function UserRoleSelect({ userId, currentRoleId, currentRoleName, callerRole, allRoles }: Props) {
  const [saving, setSaving] = useState(false)
  const [roleName, setRoleName] = useState(currentRoleName)
  const [roleId, setRoleId] = useState(currentRoleId)

  const options = assignableRoles(callerRole, allRoles)

  async function handleChange(newRoleId: string | null) {
    if (!newRoleId) return
    const newRole = allRoles.find((r) => r.id === newRoleId)
    if (!newRole || newRoleId === roleId) return

    setSaving(true)
    try {
      await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: newRoleId }),
      })
      setRoleId(newRoleId)
      setRoleName(newRole.name)
    } finally {
      setSaving(false)
    }
  }

  // If the user's current role is not in the assignable options (e.g. a Super Admin viewing a Vendor),
  // still show their role as read-only text so the table makes sense
  const canChange = options.length > 0

  if (!canChange) {
    return <span className="text-sm text-muted-foreground">{roleName}</span>
  }

  return (
    <Select value={roleId} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger className="h-8 w-36 text-sm">
        <SelectValue>{saving ? 'Saving…' : roleName}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Always show the current role even if not in assignable options */}
        {!options.find((r) => r.id === roleId) && (
          <SelectItem value={roleId} disabled>{roleName}</SelectItem>
        )}
        {options.map((r) => (
          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
