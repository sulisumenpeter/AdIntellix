import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createQueue, QUEUE_NAMES } from '../../../lib/queue/client';

export async function POST(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'landing-page-match_post', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
    const supabase = await createClient();
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, projectId, advertisementId, destinationUrl } = await req.json();
    if (typeof projectId !== 'undefined') await requireProjectOwnership(supabase, projectId, organizationId);

    if (!organizationId || !projectId || !advertisementId || !destinationUrl) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify access
    // Replaced manual org check with centralized auth
await requireOrganizationMember(supabase, userId, organizationId);


    // Replaced manual resource check with centralized auth
await requireResourceOwnership(supabase, 'advertisements', advertisementId, organizationId);


    // Enqueue job
    const queue = createQueue(QUEUE_NAMES.LANDING_PAGE_MATCH);
    await queue.add('analyze-landing-page-match', {
      organizationId,
      projectId,
      advertisementId,
      destinationUrl
    });
    await queue.close();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'landing-page-match_get', RATE_LIMITS.EXPENSIVE);
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
      .from('ad_to_landing_page_matches')
      .select('*, advertisements(advertiser_name, ad_text)')
      .eq('project_id', projectId)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
