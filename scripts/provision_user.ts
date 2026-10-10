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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = '051c4ffe-f00a-47a8-a300-13f8f412161b';
const userEmail = 'nyibangssmen@gmail.com';

async function main() {
    console.log('Checking application users table...');
    const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user:', userError);
        process.exit(1);
    }

    if (!existingUser) {
        console.log('Creating application user profile...');
        const { error: insertUserError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: userEmail,
                full_name: 'Nyibangssmen'
            });
        
        if (insertUserError) {
            console.error('Error creating user:', insertUserError);
            process.exit(1);
        }
        console.log('User profile created.');
    } else {
        console.log('User profile already exists.');
    }

    console.log('Checking for existing organization...');
    const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId);
    
    if (memberError) {
        console.error('Error fetching member:', memberError);
        process.exit(1);
    }

    if (memberData && memberData.length > 0) {
        console.log('User already belongs to an organization:', memberData[0].organization_id);
    } else {
        console.log('Creating organization...');
        const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({ name: 'Nyibangssmen Org' })
            .select()
            .single();
        
        if (orgError) {
            console.error('Error creating org:', orgError);
            process.exit(1);
        }
        
        console.log('Organization created:', newOrg.id);
        
        console.log('Adding user as owner...');
        const { error: insertMemberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: newOrg.id,
                user_id: userId,
                role: 'owner'
            });
        
        if (insertMemberError) {
            console.error('Error adding member:', insertMemberError);
            process.exit(1);
        }
        
        console.log('User added to organization as owner.');
    }
}

main().catch(console.error);
