import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '../../../../lib/supabase/server';

export async function GET(req: NextRequest) {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_profiles_get', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createApiClient(req);

  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });

  // Replaced manual org check with centralized auth
    await requireOrganizationMember(supabase, userId, organizationId);

  const { data, error } = await supabase.from('icp_profiles').select('*').eq('organization_id', organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_profiles_post', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createApiClient(req);

    const body = await req.json();
    const { name, industry, organizationId, projectId } = body;
    if (typeof projectId !== 'undefined') await requireProjectOwnership(supabase, projectId, organizationId);

    // Replaced manual org check with centralized auth
await requireOrganizationMember(supabase, userId, organizationId);


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

    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createApiClient(req);

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const organizationId = url.searchParams.get('organizationId');
    if (!organizationId) throw new Error('Missing organizationId');

    // Replaced manual org check with centralized auth
    await requireOrganizationMember(supabase, userId, organizationId);

    const { error } = await supabase.from('icp_profiles').delete().eq('id', id).eq('organization_id', organizationId);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
