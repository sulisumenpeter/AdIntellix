import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { env } from '../env'

export async function createClient() {
  const cookieStore = await cookies()
  const headersList = await headers();
  const token = headersList.get('x-user-token');

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        fetch: async (url, options) => {
          const res = await fetch(url, options);
          const newHeaders = new Headers(res.headers);
          newHeaders.delete('date');
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: newHeaders
          });
        }
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (value === '') return;
              cookieStore.set(name, value, options);
            })
          } catch (error) {}
        },
      },
    }
  )
}

export function createApiClient(req: NextRequest) {
  const token = req.headers.get('x-user-token');
  
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : undefined,
        fetch: async (url, options) => {
          const res = await fetch(url, options);
          const newHeaders = new Headers(res.headers);
          newHeaders.delete('date');
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: newHeaders
          });
        }
      }
    }
  );
}
