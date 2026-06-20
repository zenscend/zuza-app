'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, X } from 'lucide-react'
import { ROLE, type UserRole } from '@/types'

interface Props {
  callerRole: string
  allRoles: UserRole[]
  onClose: () => void
}

const schema = z.object({
  email:  z.string().email('Enter a valid email'),
  roleId: z.string().min(1, 'Select a role'),
})

type FormValues = z.infer<typeof schema>

function invitableRoles(callerRole: string, allRoles: UserRole[]): UserRole[] {
  if (callerRole === ROLE.SUPER_ADMIN) {
    return allRoles.filter((r) => r.name === ROLE.ADMIN || r.name === ROLE.FIELD_AGENT)
  }
  return allRoles.filter((r) => r.name === ROLE.FIELD_AGENT)
}

export function InviteForm({ callerRole, allRoles, onClose }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null)
  const router = useRouter()

  const options = invitableRoles(callerRole, allRoles)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: values.email, roleId: values.roleId }),
    })
    const json = await res.json()
    if (!res.ok) {
      setServerError(json.error ?? 'Failed to send invite')
      return
    }
    setInvitedEmail(values.email)
    router.refresh()
  }

  if (invitedEmail) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm">
              Invite sent to <span className="font-medium">{invitedEmail}</span>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Done</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Invite new user</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1 space-y-1">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="invite-role">Role</Label>
            <Select onValueChange={(v) => { if (v) setValue('roleId', v as string) }}>
              <SelectTrigger id="invite-role" className="w-40">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {options.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleId && <p className="text-sm text-destructive">{errors.roleId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label className="invisible">Send</Label>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send invite'}
            </Button>
          </div>
        </form>

        {serverError && <p className="text-sm text-destructive mt-3">{serverError}</p>}
      </CardContent>
    </Card>
  )
}
