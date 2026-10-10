import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function POST(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'google-ads_connections_post', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
    const supabase = await createClient();
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, projectId, clientId, clientSecret, developerToken, refreshToken, customerId } = await req.json();
    if (typeof projectId !== 'undefined') await requireProjectOwnership(supabase, projectId, organizationId);

    if (!organizationId || !projectId || !clientId || !clientSecret || !developerToken || !refreshToken || !customerId) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify access
    // Replaced manual org check with centralized auth
await requireOrganizationMember(supabase, userId, organizationId);


    // Check project belongs to org
    const { data: proj, error: projError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .single();

    if (projError || !proj) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    // Upsert connection
    const { data, error } = await supabase
      .from('google_ads_connections')
      .insert({
        organization_id: organizationId,
        project_id: projectId,
        client_id: clientId,
        client_secret: clientSecret,
        developer_token: developerToken,
        refresh_token: refreshToken,
        customer_id: customerId
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'google-ads_connections_get', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
    const supabase = await createClient();
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const orgId = searchParams.get('organizationId');

    if (!projectId || !orgId) {
      return NextResponse.json({ error: 'Missing projectId or organizationId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('google_ads_connections')
      // Don't return secrets in GET requests!
      .select('id, customer_id, created_at, updated_at')
      .eq('project_id', projectId)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
