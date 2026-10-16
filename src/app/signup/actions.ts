'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  if (!email || !password || !fullName) {
    redirect('/signup?error=All fields are required')
  }

  if (password !== confirmPassword) {
    redirect('/signup?error=Passwords do not match')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })

  if (error) {
    console.error('Supabase signup error:', error)
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  if (data.user) {
    // Prevent duplicate user creation
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!existingUser) {
      const { error: userError } = await adminSupabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName
        })

      if (userError) {
        console.error('Error creating public user:', userError)
        // Non-blocking, but problematic
      }

      // Initialize organization
      const { data: newOrg, error: orgError } = await adminSupabase
        .from('organizations')
        .insert({
          name: `${fullName}'s Organization`
        })
        .select()
        .single()

      if (!orgError && newOrg) {
        // Link user to organization as owner
        const { error: memberError } = await adminSupabase
          .from('organization_members')
          .insert({
            organization_id: newOrg.id,
            user_id: data.user.id,
            role: 'owner'
          })

        if (memberError) {
          console.error('Error adding user to organization:', memberError)
        }
      }
    }
  }

  if (data?.session === null) {
    // Email confirmation required
    redirect('/login?message=Check your email to confirm your account')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
