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
    const { name, industry, organizationId, projectId } = body;

    const authResult = await authorizeOrganization(organizationId, ['owner', 'admin']);
    if (!authResult.authorized) {
      if (authResult.error === 'unauthenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (authResult.error === 'invalid_org_id') return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
      if (authResult.error === 'internal_error') return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createApiClient(req);
    if (typeof projectId !== 'undefined' && projectId !== null) {
      await requireProjectOwnership(supabase, projectId, organizationId);
    }

    const { data, error } = await supabase.from('icp_profiles').insert({
      name, industry, organization_id: organizationId, project_id: projectId
    }).select().single();

    if (error) throw new Error(error.message);
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
    const organizationId = url.searchParams.get('organizationId');

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
