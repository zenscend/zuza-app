import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/services/userService'
import { ROLE } from '@/types'
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
    profile = await getUser(supabase, user.id)
  } catch {
    // user row may not exist yet
  }

  const roleName     = profile?.role?.name ?? null
  const isAdmin      = roleName === ROLE.ADMIN || roleName === ROLE.SUPER_ADMIN
  const isFieldAgent = roleName === ROLE.FIELD_AGENT

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

          {/* Field agent shortcuts */}
          {isFieldAgent && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <nav className="flex items-center gap-1">
                <NavLink href="/my-vendors">My Vendors</NavLink>
                <NavLink href="/onboard">Onboard</NavLink>
              </nav>
            </>
          )}

          {/* Admin shortcuts */}
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
              role={roleName}
            />
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
