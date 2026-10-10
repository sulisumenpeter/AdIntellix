import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../lib/authorization';
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

    
      
    const supabase = await createClient();
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, projectId, connectionId } = await req.json();
    if (typeof projectId !== 'undefined') await requireProjectOwnership(supabase, projectId, organizationId);

    if (!organizationId || !projectId || !connectionId) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check Idempotency-Key
    const idempotencyKey = req.headers.get('Idempotency-Key');

    // Verify access
    // Replaced manual org check with centralized auth
await requireOrganizationMember(supabase, userId, organizationId);


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
