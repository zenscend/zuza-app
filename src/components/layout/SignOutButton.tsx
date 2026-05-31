'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/services/authService'

interface Props {
  className?: string
  children?: React.ReactNode
}

export function SignOutButton({ className, children }: Props) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await signOut(supabase)
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleSignOut} className={className}>
      {children ?? 'Sign out'}
    </button>
  )
}
