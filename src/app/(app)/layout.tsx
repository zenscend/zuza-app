import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/services/profileService'
import { ZuzaLogo } from '@/components/layout/ZuzaLogo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { UserMenu } from '@/components/layout/UserMenu'
import { NavLink } from '@/components/layout/NavLink'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let profile = null
  try {
    profile = await getProfile(supabase, user.id)
  } catch {
    // profile may not exist yet
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">

          <Link href="/dashboard" className="shrink-0">
            <ZuzaLogo size="sm" />
          </Link>

          <Separator orientation="vertical" className="h-5" />

          <nav className="flex items-center gap-1">
            <NavLink href="/dashboard" exact>Dashboard</NavLink>
          </nav>

          {/* Admin shortcuts — only visible to admin/super_admin */}
          {isAdmin && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <nav className="flex items-center gap-1">
                <NavLink href="/admin/vendors">Vendors</NavLink>
              </nav>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserMenu
              name={profile?.full_name ?? null}
              email={user.email ?? null}
              avatarUrl={profile?.avatar_url ?? null}
              role={profile?.role ?? null}
            />
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
