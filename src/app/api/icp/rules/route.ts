import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '../../../../lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_rules_get', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createApiClient(req);

    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');
    if (!organizationId) return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });

    await requireOrganizationMember(supabase, userId, organizationId);

    // Fetch all rules for profiles belonging to this org
    // Since RLS handles this, we can just select('*').
    // But to be safe and explicit:
    const { data, error } = await supabase.from('icp_rules').select('*');
    if (error) throw new Error(error.message);

    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_rules_post', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      

    
    
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createApiClient(req);

    const body = await req.json();
    const { icpProfileId, rule_type, operator, value, weight, organizationId } = body;

    // Replaced manual org check with centralized auth
    await requireOrganizationMember(supabase, userId, organizationId);

    // Verify ICP profile belongs to the organization
    const { data: profile, error: profileErr } = await supabase.from('icp_profiles').select('id').eq('id', icpProfileId).eq('organization_id', organizationId).single();
    if (!profile) {
      console.error('ICP PROFILE NOT FOUND:', { icpProfileId, organizationId, profileErr });
      return NextResponse.json({ error: 'ICP profile not found in org' }, { status: 404 });
    }

    const { data, error } = await supabase.from('icp_rules').insert({
      icp_profile_id: icpProfileId, rule_type, operator, value, weight
    }).select().single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_rules_delete', RATE_LIMITS.DEFAULT);
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

    if (id && id !== 'undefined' && id !== 'null') {
      const { error } = await supabase.from('icp_rules').delete().eq('id', id).eq('organization_id', organizationId);
      if (error) {
        console.error('DELETE RULE ERROR:', error.message);
        throw new Error(error.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
