import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read from .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');

let supabaseUrl = '';
let supabaseServiceKey = '';

envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseServiceKey = line.split('=')[1].trim();
});

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
const userId = '051c4ffe-f00a-47a8-a300-13f8f412161b';

async function setPassword() {
    console.log('Setting test password for E2E verification...');
    const { data, error } = await adminSupabase.auth.admin.updateUserById(
        userId,
        { password: 'TestPassword123!' }
    );
    if (error) {
        console.error('Error setting password:', error);
        process.exit(1);
    }
    console.log('Password set successfully.');
}

setPassword().catch(console.error);
