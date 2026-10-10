import { createBrowserClient } from '@supabase/ssr'
import { env } from '../env'

export function createClient() {
  const isPlaywright = typeof window !== 'undefined' && 
    (window.navigator.userAgent.includes('Playwright') || localStorage.getItem('is_playwright') === 'true');
  
  if (typeof window !== 'undefined' && isPlaywright) {
      console.log('[Supabase Client] Playwright mode enabled, autoRefreshToken=false');
  }

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: !isPlaywright,
        persistSession: true,
      },
      global: {
        fetch: async (url, options) => {
          const res = await fetch(url, options);
          const headers = new Headers(res.headers);
          headers.delete('date');
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers
          });
        }
      }
    }
  )
}
