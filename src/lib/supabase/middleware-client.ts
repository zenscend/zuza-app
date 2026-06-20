import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isAuthRoute  = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isAppRoute   = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')
  const isAdminRoute = pathname.startsWith('/admin')
  const isAgentRoute = pathname.startsWith('/my-vendors') || pathname.startsWith('/onboard')

  // Redirect unauthenticated users to login
  if (!user && (isAppRoute || isAdminRoute || isAgentRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Role-gate admin routes
  if (user && isAdminRoute) {
    const { data: userRow } = await supabase
      .from('users')
      .select('user_role(name)')
      .eq('id', user.id)
      .single()

    const roleRow = userRow?.user_role as unknown
    const roleName: string | undefined = Array.isArray(roleRow) ? roleRow[0]?.name : (roleRow as { name?: string } | null)?.name
    if (!roleName || (roleName !== 'Admin' && roleName !== 'Super Admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Role-gate agent routes
  if (user && isAgentRoute) {
    const { data: userRow } = await supabase
      .from('users')
      .select('user_role(name)')
      .eq('id', user.id)
      .single()

    const roleRow = userRow?.user_role as unknown
    const roleName: string | undefined = Array.isArray(roleRow) ? roleRow[0]?.name : (roleRow as { name?: string } | null)?.name
    const agentRoles = ['Field Agent', 'Admin', 'Super Admin']
    if (!roleName || !agentRoles.includes(roleName)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
