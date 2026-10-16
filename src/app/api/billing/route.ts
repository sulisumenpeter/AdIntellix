import { requireOrganizationMember } from '../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'billing_get', RATE_LIMITS.DEFAULT);
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

    await requireOrganizationMember(supabase, userId, orgId);

    // Fetch subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (subError) throw subError;

    // Fetch billing events
    const { data: events, error: eventsError } = await supabase
      .from('billing_events')
      .select('id, paddle_event_id, event_type, status, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (eventsError) throw eventsError;

    return NextResponse.json({ 
      data: {
        subscription: subscription || null,
        events: events || []
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
