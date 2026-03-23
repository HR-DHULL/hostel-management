import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: do not add logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public paths that don't require auth
  const isLoginPath = pathname === '/login' || pathname === '/portal/login'
  const isPortalPath = pathname.startsWith('/portal')
  const isAdminPath = !isPortalPath && !isLoginPath && pathname !== '/'

  // Not authenticated
  if (!user) {
    if (!isLoginPath) {
      const loginPath = isPortalPath ? '/portal/login' : '/login'
      return NextResponse.redirect(new URL(loginPath, request.url))
    }
    return supabaseResponse
  }

  // Authenticated — get role from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'staff'

  // Redirect students away from admin routes
  if (role === 'student' && isAdminPath) {
    return NextResponse.redirect(new URL('/portal/dashboard', request.url))
  }

  // Redirect staff/owner away from portal routes (except portal login)
  if (role !== 'student' && isPortalPath && pathname !== '/portal/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect authenticated users away from login pages
  if (isLoginPath) {
    const dest = role === 'student' ? '/portal/dashboard' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
