import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/services/profileService'
import { ZuzaLogo } from '@/components/layout/ZuzaLogo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { UserMenu } from '@/components/layout/UserMenu'
import { NavLink } from '@/components/layout/NavLink'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(supabase, user.id)

  const allowedRoles = ['field_agent', 'admin', 'super_admin']
  if (!allowedRoles.includes(profile.role)) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">

          <Link href="/my-vendors" className="shrink-0">
            <ZuzaLogo size="sm" />
          </Link>

          <Separator orientation="vertical" className="h-5" />

          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground select-none">
            Field
          </span>

          <Separator orientation="vertical" className="h-5" />

          <nav className="flex items-center gap-1">
            <NavLink href="/my-vendors">My Vendors</NavLink>
            <NavLink href="/onboard">Onboard</NavLink>
          </nav>

          {/* Admins get quick jump to admin panel */}
          {(profile.role === 'admin' || profile.role === 'super_admin') && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <nav className="flex items-center gap-1">
                <NavLink href="/admin/vendors">Admin</NavLink>
              </nav>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserMenu
              name={profile.full_name ?? null}
              email={user.email ?? null}
              avatarUrl={profile.avatar_url ?? null}
              role={profile.role ?? null}
            />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
