import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createQueue, QUEUE_NAMES } from '../../../lib/queue/client';

export async function POST(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'ad-fatigue_post', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
    const supabase = await createClient();
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, advertisementId } = await req.json();

    if (!organizationId || !advertisementId) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify access
    // Replaced manual org check with centralized auth
await requireOrganizationMember(supabase, userId, organizationId);


    // Replaced manual resource check with centralized auth
await requireResourceOwnership(supabase, 'advertisements', advertisementId, organizationId);


    // Enqueue job
    const queue = createQueue(QUEUE_NAMES.AD_FATIGUE);
    await queue.add('analyze-fatigue', {
      organizationId,
      advertisementId
    });
    await queue.close();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'ad-fatigue_get', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
    const supabase = await createClient();
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('organizationId');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ad_fatigue_reports')
      .select('*, advertisements(advertiser_name, ad_text)')
      .eq('organization_id', orgId)
      .order('fatigue_score', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
