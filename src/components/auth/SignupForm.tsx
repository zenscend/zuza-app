'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { signUpWithPassword, resendConfirmation } from '@/services/authService'
import { Mail } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  fullName:        z.string().min(2, 'Enter your full name'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

export function SignupForm() {
  const [serverError, setServerError]       = useState<string | null>(null)
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null)
  const [resendLoading, setResendLoading]   = useState(false)
  const [resendSent, setResendSent]         = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const supabase = createClient()
      const { session } = await signUpWithPassword(supabase, values.email, values.password, values.fullName)
      if (session) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setConfirmedEmail(values.email)
      }
    } catch (err) {
      setServerError((err as Error).message ?? 'Sign up failed')
    }
  }

  async function handleResend() {
    if (!confirmedEmail) return
    setResendLoading(true)
    setResendSent(false)
    try {
      const supabase = createClient()
      await resendConfirmation(supabase, confirmedEmail)
      setResendSent(true)
    } catch {
      // silently fail — user still sees the original instruction
    } finally {
      setResendLoading(false)
    }
  }

  if (confirmedEmail) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Check your inbox</p>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a confirmation link to{' '}
              <span className="font-medium text-foreground">{confirmedEmail}</span>
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Can&apos;t find it? Check your spam folder.
        </p>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={resendLoading || resendSent}
        >
          {resendLoading ? 'Sending…' : resendSent ? 'Sent!' : 'Resend confirmation email'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" placeholder="Your full name" {...register('fullName')} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Min. 8 characters" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}
