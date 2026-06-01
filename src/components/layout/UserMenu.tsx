'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SignOutButton } from './SignOutButton'
import { LogOut } from 'lucide-react'
import type { UserRole } from '@/types'

interface Props {
  name: string | null
  email: string | null
  avatarUrl: string | null
  role: UserRole | null
}

const ROLE_LABELS: Record<UserRole, string> = {
  vendor:      'Vendor',
  field_agent: 'Field Agent',
  admin:       'Admin',
  super_admin: 'Super Admin',
}

const ROLE_COLORS: Record<UserRole, string> = {
  vendor:      'bg-muted text-muted-foreground',
  field_agent: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  admin:       'bg-primary/20 text-primary',
  super_admin: 'bg-primary text-primary-foreground',
}

function getInitials(name: string | null, email: string | null): string {
  if (name) return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  return (email?.[0] ?? 'U').toUpperCase()
}

export function UserMenu({ name, email, avatarUrl, role }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
        <Avatar className="h-8 w-8">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name ?? 'User'} />}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {getInitials(name, email)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        {/* User info header — plain div, NOT DropdownMenuLabel (requires Group context in Base UI) */}
        <div className="px-2 py-2 border-b border-border mb-1">
          {name && <p className="font-semibold text-sm leading-none mb-1">{name}</p>}
          {email && <p className="text-xs text-muted-foreground truncate mb-2">{email}</p>}
          {role && (
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}>
              {ROLE_LABELS[role]}
            </span>
          )}
        </div>

        <DropdownMenuItem className="p-0">
          <SignOutButton className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-destructive">
            <LogOut className="h-4 w-4" />
            Sign out
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
