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

export interface SubscriptionAuthSuccess {
  authorized: true;
  status: 'active' | 'trialing' | 'free';
  planId: string | null;
}

export interface SubscriptionAuthFailure {
  authorized: false;
  error: 'unauthenticated' | 'invalid_org_id' | 'payment_failed' | 'subscription_expired' | 'internal_error';
}

export type SubscriptionAuthResult = SubscriptionAuthSuccess | SubscriptionAuthFailure;

export async function authorizeSubscription(
  organizationIdRaw: unknown
): Promise<SubscriptionAuthResult> {
  try {
    const orgIdResult = OrgIdSchema.safeParse(organizationIdRaw);
    if (!orgIdResult.success) {
      return { authorized: false, error: 'invalid_org_id' };
    }
    const organizationId = orgIdResult.data;

    const supabase = await createClient();

    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('status, plan_id, current_period_end')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      return { authorized: false, error: 'internal_error' };
    }

    if (!sub) {
      // Free tier
      return { authorized: true, status: 'free', planId: null };
    }

    if (sub.status === 'past_due' || sub.status === 'failed') {
      return { authorized: false, error: 'payment_failed' };
    }

    if (sub.status === 'canceled' || sub.status === 'expired') {
      // Check if current_period_end is in the future (grace period)
      if (sub.current_period_end && new Date(sub.current_period_end).getTime() > Date.now()) {
        return { authorized: true, status: 'active', planId: sub.plan_id };
      }
      return { authorized: false, error: 'subscription_expired' };
    }

    if (sub.status === 'active' || sub.status === 'trialing') {
      return { authorized: true, status: sub.status, planId: sub.plan_id };
    }

    return { authorized: false, error: 'subscription_expired' };
  } catch (err) {
    return { authorized: false, error: 'internal_error' };
  }
}
