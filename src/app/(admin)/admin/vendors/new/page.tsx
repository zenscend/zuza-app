import { createClient } from '@/lib/supabase/server'
import { VendorOnboardingForm } from '@/components/vendor/VendorOnboardingForm'
import { redirect } from 'next/navigation'

export default async function NewVendorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Register new vendor</h1>
        <p className="text-muted-foreground">
          Capture vendor details during field onboarding.
        </p>
      </div>
      <VendorOnboardingForm onboardedBy={user.id} cancelHref="/admin/vendors" />
    </div>
  )
}
