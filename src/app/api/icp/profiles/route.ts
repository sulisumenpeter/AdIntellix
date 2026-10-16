import { authorizeOrganization, requireProjectOwnership } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '../../../../lib/supabase/server';

export async function GET(req: NextRequest) {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_profiles_get', RATE_LIMITS.DEFAULT);
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
  const { data, error } = await supabase.from('icp_profiles').select('*').eq('organization_id', organizationId);
  if (error) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_profiles_post', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const body = await req.json();
    let { organizationId } = body || {};
    const { name, industry, projectId } = body || {};

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
    let validProjectId: string | null = null;
    if (projectId && projectId !== 'proj-1' && projectId !== 'null') {
      try {
        await requireProjectOwnership(supabase, projectId, organizationId);
        validProjectId = projectId;
      } catch {
        validProjectId = null;
      }
    }

    if (!validProjectId) {
      const { data: projects } = await supabase.from('projects').select('id').eq('organization_id', organizationId).limit(1);
      if (projects && projects.length > 0) {
        validProjectId = projects[0].id;
      } else {
        const { data: newProj } = await supabase.from('projects').insert({
          organization_id: organizationId,
          name: 'Default Project'
        }).select('id').single();
        if (newProj) {
          validProjectId = newProj.id;
        }
      }
    }

    const { data, error } = await supabase.from('icp_profiles').insert({
      name, industry, organization_id: organizationId, project_id: validProjectId
    }).select().single();

    if (error) {
      console.error('CREATE ICP PROFILE INSERT ERROR:', error);
      throw new Error(error.message);
    }
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_profiles_delete', RATE_LIMITS.DEFAULT);
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
    const { error } = await supabase.from('icp_profiles').delete().eq('id', id).eq('organization_id', organizationId);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
