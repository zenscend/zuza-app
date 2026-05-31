import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/services/profileService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    try {
      profile = await getProfile(supabase, user.id)
    } catch {
      // Profile may not exist yet if trigger hasn't run
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="text-muted-foreground">Your Zuza dashboard</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Register your business</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add your business details to start receiving bulk order benefits.
            </p>
            <Link href="/onboarding" className={cn(buttonVariants())}>
              Start onboarding
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
