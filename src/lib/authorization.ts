import { createClient } from './supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

export async function getSessionUser() {
  const supabase = await createClient();
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const user = { id: userId };
  return { supabase, user };
}

export async function requireOrganizationMember(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
  requiredRoles: ('owner' | 'admin' | 'member' | 'viewer')[] = []
) {
  if (!organizationId) throw new Error('Missing organizationId');

  const { data: member, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  if (error || !member) {
    throw new Error('Forbidden: Not an organization member');
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(member.role as 'owner' | 'admin' | 'member' | 'viewer')) {
    throw new Error(`Forbidden: Required role in ${requiredRoles.join(', ')}`);
  }

  return member;
}

export async function requireProjectOwnership(
  supabase: SupabaseClient,
  projectId: string,
  organizationId: string
) {
  if (!projectId) return;

  const { data: project, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !project) {
    throw new Error('Forbidden: Project does not belong to organization');
  }
}

export async function requireResourceOwnership(
  supabase: SupabaseClient,
  tableName: string,
  resourceId: string,
  organizationId: string
) {
  if (!resourceId) return;

  const { data: resource, error } = await supabase
    .from(tableName)
    .select('id')
    .eq('id', resourceId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !resource) {
    throw new Error(`Forbidden: ${tableName} resource does not belong to organization`);
  }
}

import { z } from 'zod';

export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface AuthSuccess {
  authorized: true;
  user: { id: string };
  role: Role;
  organizationId: string;
}

export interface AuthFailure {
  authorized: false;
  error: 'unauthenticated' | 'invalid_org_id' | 'forbidden_not_member' | 'forbidden_insufficient_role' | 'internal_error';
}

export type AuthResult = AuthSuccess | AuthFailure;

const OrgIdSchema = z.string().uuid();

export async function authorizeOrganization(
  organizationIdRaw: unknown,
  requiredRoles: Role[] = []
): Promise<AuthResult> {
  try {
    const orgIdResult = OrgIdSchema.safeParse(organizationIdRaw);
    if (!orgIdResult.success) {
      return { authorized: false, error: 'invalid_org_id' };
    }
    const organizationId = orgIdResult.data;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return { authorized: false, error: 'unauthenticated' };
    }

    const { data: member, error: dbError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (dbError || !member) {
      return { authorized: false, error: 'forbidden_not_member' };
    }

    const role = member.role as Role;

    if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
      return { authorized: false, error: 'forbidden_insufficient_role' };
    }

    return {
      authorized: true,
      user: { id: user.id },
      role,
      organizationId
    };
  } catch (err) {
    return { authorized: false, error: 'internal_error' };
  }
}
