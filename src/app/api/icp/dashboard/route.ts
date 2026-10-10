import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '../../../../lib/supabase/server';
import { requireOrganizationMember } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_dashboard_get', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabaseServer = createApiClient(req);

    const url = new URL(req.url);
    let organizationId = url.searchParams.get('organizationId');
    
    if (!organizationId || organizationId === 'null' || organizationId === 'undefined') {
       const { data: orgMembers } = await supabaseServer.from('organization_members').select('organization_id').eq('user_id', userId).limit(1);
       if (orgMembers && orgMembers.length > 0) {
         organizationId = orgMembers[0].organization_id;
       }
    }

    if (!organizationId) return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });

    await requireOrganizationMember(supabaseServer, userId, organizationId);

    const [pRes, rRes, lRes, sRes, projRes] = await Promise.all([
      supabaseServer.from('icp_profiles').select('*').eq('organization_id', organizationId),
      supabaseServer.from('icp_rules').select('*'),
      supabaseServer.from('leads').select('*').eq('organization_id', organizationId).limit(50),
      supabaseServer.from('lead_scores').select('*'),
      supabaseServer.from('projects').select('id').eq('organization_id', organizationId).limit(1)
    ]);

    return NextResponse.json({
      organizationId,
      projectId: projRes.data?.[0]?.id || null,
      profiles: pRes.data || [],
      rules: rRes.data || [],
      leads: lRes.data || [],
      scores: sRes.data || []
    });
  } catch (err: unknown) {
    console.error('DASHBOARD API ERROR:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}
