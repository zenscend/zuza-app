import { createClient } from '@/lib/supabase/server'
import { VendorOnboardingForm } from '@/components/vendor/VendorOnboardingForm'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Cancel — back to dashboard */}
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 text-muted-foreground')}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Register your business</h1>
        <p className="text-muted-foreground">
          Tell us about your business so we can connect you with bulk savings.
        </p>
      </div>

      <VendorOnboardingForm onboardedBy={user?.id} cancelHref="/dashboard" />
    </main>
  )
}
