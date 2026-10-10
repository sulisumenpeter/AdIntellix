import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

/**
 * Creates a Supabase client with the Service Role Key.
 * This MUST ONLY be used in secure server environments (e.g. webhooks, cron jobs)
 * where there is no user session but elevated privileges are required.
 * 
 * Always explicitly filter by organizationId or tenant context when using this client
 * to ensure tenant isolation is maintained at the application level.
 */
export function createAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );
}
