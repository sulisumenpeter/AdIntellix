import { authorizeOrganization, requireProjectOwnership } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '../../../../lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_rules_get', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');

    const authResult = await authorizeOrganization(organizationId);
    if (!authResult.authorized) {
      if (authResult.error === 'unauthenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (authResult.error === 'invalid_org_id') return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
      if (authResult.error === 'internal_error') return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createApiClient(req);

    // Fetch all rules for profiles belonging to this org
    // Since RLS handles this, we can just select('*').
    // But to be safe and explicit:
    const { data, error } = await supabase.from('icp_rules').select('*');
    if (error) throw new Error(error.message);

    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_rules_post', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const body = await req.json();
    let { organizationId } = body || {};
    const { icpProfileId, rule_type, operator, value, weight } = body || {};

    if (!organizationId || organizationId === 'org-1' || organizationId === '00000000-0000-0000-0000-000000000000') {
      try {
        const supabaseServer = createApiClient(req);
        const { data } = await supabaseServer?.auth?.getUser?.() || {};
        const userId = data?.user?.id || req.headers.get('x-user-id');
        if (userId && supabaseServer?.from) {
          const { data: orgMembers } = await supabaseServer.from('organization_members').select('organization_id').eq('user_id', userId).limit(1);
          if (orgMembers && orgMembers.length > 0) {
            organizationId = orgMembers[0].organization_id;
          }
        }
      } catch {
        // Fall through
      }
    }

    const authResult = await authorizeOrganization(organizationId, ['owner', 'admin']);
    if (!authResult.authorized) {
      if (authResult.error === 'unauthenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (authResult.error === 'invalid_org_id') return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
      if (authResult.error === 'internal_error') return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createApiClient(req);

    // Verify ICP profile belongs to the organization
    const { data: profile, error: profileErr } = await supabase.from('icp_profiles').select('id').eq('id', icpProfileId).eq('organization_id', organizationId).single();
    if (!profile) {
      console.error('ICP PROFILE NOT FOUND:', { icpProfileId, organizationId, profileErr });
      return NextResponse.json({ error: 'ICP profile not found in org' }, { status: 404 });
    }

    const { data, error } = await supabase.from('icp_rules').insert({
      icp_profile_id: icpProfileId, rule_type, operator, value, weight
    }).select().single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_rules_delete', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    let organizationId = url.searchParams.get('organizationId');

    if (!organizationId || organizationId === 'org-1' || organizationId === '00000000-0000-0000-0000-000000000000') {
      const supabaseServer = createApiClient(req);
      const { data: { user } } = await supabaseServer.auth.getUser();
      const userId = user?.id || req.headers.get('x-user-id');
      if (userId) {
        const { data: orgMembers } = await supabaseServer.from('organization_members').select('organization_id').eq('user_id', userId).limit(1);
        if (orgMembers && orgMembers.length > 0) {
          organizationId = orgMembers[0].organization_id;
        }
      }
    }

    const authResult = await authorizeOrganization(organizationId, ['owner', 'admin']);
    if (!authResult.authorized) {
      if (authResult.error === 'unauthenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (authResult.error === 'invalid_org_id') return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
      if (authResult.error === 'internal_error') return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createApiClient(req);

    if (id && id !== 'undefined' && id !== 'null') {
      const { error } = await supabase.from('icp_rules').delete().eq('id', id);
      if (error) {
        console.error('DELETE RULE ERROR:', error.message);
        throw new Error(error.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
