import { authorizeOrganization, authorizeSubscription, requireProjectOwnership } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { createQueue, QUEUE_NAMES } from '../../../../lib/queue/client';

export async function POST(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'google-ads_search-terms_post', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const { organizationId, projectId, connectionId } = await req.json();

    if (!organizationId || !projectId || !connectionId) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authResult = await authorizeOrganization(organizationId, ['owner', 'admin']);
    if (!authResult.authorized) {
      if (authResult.error === 'unauthenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (authResult.error === 'invalid_org_id') return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const subResult = await authorizeSubscription(organizationId);
    if (!subResult.authorized || subResult.status === 'free') {
      return NextResponse.json({ error: 'Upgrade required for Google Ads syncing' }, { status: 403 });
    }

    const supabase = await createClient();
    if (typeof projectId !== 'undefined') await requireProjectOwnership(supabase, projectId, organizationId);

    // Check Idempotency-Key
    const idempotencyKey = req.headers.get('Idempotency-Key');

    // Verify connection belongs to org/project
    const { data: conn, error: connError } = await supabase
      .from('google_ads_connections')
      .select('id')
      .eq('id', connectionId)
      .eq('organization_id', organizationId)
      .eq('project_id', projectId)
      .single();

    if (connError || !conn) {
      return NextResponse.json({ error: 'Connection not found or unauthorized' }, { status: 404 });
    }

    // Enqueue job with optional job ID for idempotency
    const queue = createQueue(QUEUE_NAMES.GOOGLE_ADS_IMPORT);
    await queue.add('import-search-terms', {
      organizationId,
      projectId,
      connectionId
    }, idempotencyKey ? { jobId: idempotencyKey } : undefined);
    
    await queue.close();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'google-ads_search-terms_get', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const orgId = searchParams.get('organizationId');

    if (!projectId || !orgId) {
      return NextResponse.json({ error: 'Missing projectId or organizationId' }, { status: 400 });
    }

    const authResult = await authorizeOrganization(orgId);
    if (!authResult.authorized) {
      if (authResult.error === 'unauthenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (authResult.error === 'invalid_org_id') return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    let query = supabase
      .from('google_ads_search_terms')
      .select('*')
      .eq('project_id', projectId)
      .eq('organization_id', orgId)
      .order('imported_at', { ascending: false });

    const classification = searchParams.get('classification');
    if (classification && classification !== 'all') {
        query = query.eq('classification', classification);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
