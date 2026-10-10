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
    const orgId = '75ef8c3d-6826-417c-afd8-f8d9ae8f7375';
    const { data: projs, error: err } = await adminSupabase.from('projects').select('*').eq('organization_id', orgId);
    if (!projs || projs.length === 0) {
        console.log('Inserting project...');
        const { data, error } = await adminSupabase.from('projects').insert({
            name: 'Default Test Project',
            organization_id: orgId
        });
        console.log('Inserted:', error);
    } else {
        console.log('Project already exists:', projs[0].id);
    }
}

check().catch(console.error);
