// Imports
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Middleware logic
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/signup-success',
    '/auth/error',
    '/auth/callback',
    '/portal',
    '/invite',
    '/api/portal',
  ]

  const protectedPaths = ['/tenantdashboard', '/clientdashboard', '/onboarding', '/api/clients', '/api/workflows', '/api/team']
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )

  const isAdminPath = pathname.startsWith('/admin')
  const authPaths = ['/auth/login', '/auth/signup']
  const isAuthPath = authPaths.some(path => pathname === path)

  if ((isProtectedPath || isAdminPath) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (user) {
    let isSuperAdmin = user.app_metadata?.role === 'super_admin' || user.user_metadata?.is_super_admin
    const isCandidate = user.user_metadata?.is_candidate

    if (!isSuperAdmin && (isAdminPath || isAuthPath)) {
      const { data: adminCheck } = await supabase
        .from('super_admins')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (adminCheck) {
        isSuperAdmin = true
      }
    }

    if (isSuperAdmin) {
      if (isAuthPath || pathname.startsWith('/tenantdashboard') || pathname.startsWith('/clientdashboard') || pathname.startsWith('/onboarding')) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    if (isCandidate) {
      if (isAdminPath || pathname.startsWith('/tenantdashboard') || isAuthPath) {
        const { data: client } = await supabase
          .from('clients')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (client && client.status === 'pending') {
          const { data: tokenRecord } = await supabase
            .from('candidate_access_tokens')
            .select('token')
            .eq('candidate_id', client.id)
            .maybeSingle()

          if (tokenRecord) {
            const url = request.nextUrl.clone()
            url.pathname = `/portal/${tokenRecord.token}`
            return NextResponse.redirect(url)
          }
        }
        
        const url = request.nextUrl.clone()
        url.pathname = '/clientdashboard'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    const needsRoleCheck = 
      isAuthPath || 
      isAdminPath || 
      pathname.startsWith('/tenantdashboard') || 
      pathname.startsWith('/clientdashboard') || 
      pathname.startsWith('/onboarding')

    if (needsRoleCheck) {
      const [{ data: clientRecord }, { data: memberships, error: memberError }] = await Promise.all([
        supabase.from('clients').select('id, status').eq('user_id', user.id).limit(1),
        supabase.from('team_members').select('company_id').eq('user_id', user.id).limit(1)
      ])

      const isClient = !!clientRecord && clientRecord.length > 0
      const hasWorkspace = !memberError && memberships && memberships.length > 0

      if (isAuthPath) {
        const url = request.nextUrl.clone()
        if (hasWorkspace) {
          url.pathname = '/tenantdashboard'
        } else if (isClient) {
          if (clientRecord[0].status === 'pending') {
            const { data: tokenRecord } = await supabase
              .from('candidate_access_tokens')
              .select('token')
              .eq('candidate_id', clientRecord[0].id)
              .maybeSingle()
            
            url.pathname = tokenRecord ? `/portal/${tokenRecord.token}` : '/clientdashboard'
          } else {
            url.pathname = '/clientdashboard'
          }
        } else {
          url.pathname = '/onboarding'
        }
        return NextResponse.redirect(url)
      }

      if (pathname.startsWith('/tenantdashboard')) {
        if (!hasWorkspace) {
          const url = request.nextUrl.clone()
          url.pathname = isClient ? '/clientdashboard' : '/onboarding'
          return NextResponse.redirect(url)
        }
        return supabaseResponse
      }

      if (pathname.startsWith('/clientdashboard') || pathname.startsWith('/portal')) {
        if (!isClient && !isSuperAdmin) {
          const url = request.nextUrl.clone()
          url.pathname = hasWorkspace ? '/tenantdashboard' : '/onboarding'
          return NextResponse.redirect(url)
        }
        return supabaseResponse
      }

      if (pathname === '/onboarding' && hasWorkspace) {
        const url = request.nextUrl.clone()
        url.pathname = '/tenantdashboard'
        return NextResponse.redirect(url)
      }

      if (isAdminPath && !isSuperAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = hasWorkspace ? '/tenantdashboard' : (isClient ? '/clientdashboard' : '/onboarding')
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}