import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '../../../../lib/supabase/server';
import { createQueue, QUEUE_NAMES } from '../../../../lib/queue/client';

const reportGenerationQueue = createQueue(QUEUE_NAMES.ICP_REPORT_GENERATION);

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'icp_export_post', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      

    
    
    const supabase = createApiClient(req);
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = { id: userId };

    const body = await req.json();
    const { organizationId, projectId, type } = body;
    if (typeof projectId !== 'undefined') await requireProjectOwnership(supabase, projectId, organizationId); // type is 'csv' or 'pdf'

    if (!organizationId || !projectId || !type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Insert report run record
    const { data: reportRun, error: reportErr } = await supabase
      .from('report_runs')
      .insert({
        organization_id: organizationId,
        project_id: projectId,
        report_type: type,
        status: 'pending'
      })
      .select('id')
      .single();

    if (reportErr || !reportRun) {
      throw new Error(`Failed to create report run: ${reportErr?.message}`);
    }

    // Queue worker job
    await reportGenerationQueue.add('generate-export', {
      reportRunId: reportRun.id,
      organizationId,
      projectId,
      type
    });

    return NextResponse.json({ success: true, reportRunId: reportRun.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
