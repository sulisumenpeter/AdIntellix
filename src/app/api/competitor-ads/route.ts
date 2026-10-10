import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: Request) {
  try {
    const rateLimit = await rateLimitRequest(request as unknown as Parameters<typeof rateLimitRequest>[0], 'competitor-ads_get', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
    const supabase = await createClient();
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const orgId = searchParams.get('orgId');

    if (!projectId || !orgId) {
      // Just return projects and org
      const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
      const organizationId = orgs?.[0]?.id;

      if (!organizationId) {
        return NextResponse.json({ projects: [] });
      }

      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('organization_id', organizationId);

      return NextResponse.json({ organizationId, projects: projects || [] });
    }

    // Validate project/org access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', orgId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
    }

    // Fetch ads with analyses
    const { data: ads, error: adsError } = await supabase
      .from('advertisements')
      .select(`
        *,
        advertisement_analyses(hook, offer, cta, messaging_theme)
      `)
      .eq('project_id', projectId)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (adsError) {
      return NextResponse.json({ error: adsError.message }, { status: 500 });
    }

    return NextResponse.json({ ads: ads || [] });

  } catch (error: unknown) {
    console.error('Competitor ads fetch failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
