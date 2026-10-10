import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { PatternDetectorService } from '../../../../lib/intelligence/pattern-detector';

export async function GET(request: Request) {
  try {
    const rateLimit = await rateLimitRequest(request as unknown as Parameters<typeof rateLimitRequest>[0], 'competitor-ads_patterns_get', RATE_LIMITS.EXPENSIVE);
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
      return NextResponse.json({ error: 'Missing projectId or orgId' }, { status: 400 });
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

    const patterns = await PatternDetectorService.getPatterns(projectId, orgId);
    const longRunning = await PatternDetectorService.getLongRunningAds(projectId, orgId, 14); // e.g. 14 days minimum

    return NextResponse.json({ 
      patterns,
      longRunning
    });

  } catch (error: unknown) {
    console.error('Pattern fetch failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
