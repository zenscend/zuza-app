import { createClient } from '@/lib/supabase/server'
import { VendorOnboardingForm } from '@/components/vendor/VendorOnboardingForm'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AgentOnboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/my-vendors"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 text-muted-foreground')}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        My vendors
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Register new vendor</h1>
        <p className="text-muted-foreground">
          Capture vendor details during field onboarding.
        </p>
      </div>

      <VendorOnboardingForm onboardedBy={user?.id} cancelHref="/my-vendors" />
    </div>
  )
}
