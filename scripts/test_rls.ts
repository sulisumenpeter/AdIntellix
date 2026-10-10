import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');

let supabaseUrl = '';
let supabaseAnonKey = '';

envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'nyibangssmen@gmail.com',
        password: 'TestPassword123!'
    });
    if (authErr) {
        console.error('Login failed:', authErr);
        process.exit(1);
    }
    console.log('Logged in as:', authData.user?.id);

    const { data: orgs, error: orgsErr } = await supabase.from('organizations').select('*');
    console.log('Orgs fetched:', orgs, orgsErr);
    
    const { data: members, error: memErr } = await supabase.from('organization_members').select('*');
    console.log('Members fetched:', members, memErr);
}

check().catch(console.error);
