import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
      },
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

  // SECURITY: Delete any incoming spoofed auth headers before downstream routing
  request.headers.delete('x-user-id');
  request.headers.delete('x-user-token');

  let user = null;
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (supabaseUser) {
    // Also retrieve the session to get the access token if needed for downstream API calls
    const { data: { session } } = await supabase.auth.getSession();
    user = { id: supabaseUser.id, token: session?.access_token };
  }

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Pass user ID to downstream API routes to avoid redundant getSession calls
  if (user) {
    request.headers.set('x-user-id', user.id)
    if (user.token) {
      request.headers.set('x-user-token', user.token)
    }
  }

  // We must recreate supabaseResponse to include the modified request headers (both additions and deletions)
  const prevCookies = supabaseResponse.cookies;
  supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  // Copy over any cookies that were set
  prevCookies.getAll().forEach(c => supabaseResponse.cookies.set(c.name, c.value, c))

  // Basic Security Headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
