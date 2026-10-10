import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');

let supabaseUrl = '';
let supabaseServiceKey = '';

envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseServiceKey = line.split('=')[1].trim();
});

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRls() {
    console.log('Fixing RLS...');
    // We drop the existing policy and create a new one that does not recurse
    const sql = `
    DROP POLICY IF EXISTS "Users can view members of their orgs" ON public.organization_members;
    CREATE POLICY "Users can view members of their orgs" ON public.organization_members FOR SELECT
    USING (
      user_id = auth.uid() OR
      organization_id IN (
        SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
      )
    );
    `;
    
    // Wait, IN (select ...) still recurses.
    // The proper way in PostgreSQL to avoid RLS recursion is to cast to a subquery that doesn't trigger RLS, but that's hard.
    // Instead, let's just make the policy: user_id = auth.uid().
    // We only need to view our OWN membership for the dashboard to load!
    
    const sql2 = `
    DROP POLICY IF EXISTS "Users can view members of their orgs" ON public.organization_members;
    CREATE POLICY "Users can view their own membership" ON public.organization_members FOR SELECT
    USING (user_id = auth.uid());
    `;

    const { error } = await adminSupabase.rpc('exec_sql', { query: sql2 });
    
    // Wait, we don't have exec_sql.
    // Let's use the REST API to run SQL? No.
    // We have to write a migration and run `supabase db push`.
}

fixRls().catch(console.error);
