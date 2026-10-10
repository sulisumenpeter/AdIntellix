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

async function check() {
    const { data: users, error: err1 } = await adminSupabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === 'nyibangssmen@gmail.com');
    if (!user) {
        console.log('User not found');
        return;
    }
    console.log('User:', user.id);
    const { data: members, error: err2 } = await adminSupabase.from('organization_members').select('*').eq('user_id', user.id);
    console.log('Members:', members, err2);
}

check().catch(console.error);
