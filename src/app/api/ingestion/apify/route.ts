import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { createQueue, QUEUE_NAMES } from '../../../../lib/queue/client';
import { ApifyIngestionJobData } from '../../../../lib/queue/apify-worker';
import { z } from 'zod';

const ingestionRequestSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  searchUrl: z.string().url().refine(val => val.startsWith('https://www.facebook.com/ads/library'), {
    message: "Must be a valid Facebook Ads Library URL"
  }),
  resultsLimit: z.number().int().min(1).max(100).default(10)
});

export async function POST(request: Request) {
  try {
    const rateLimit = await rateLimitRequest(request as unknown as Parameters<typeof rateLimitRequest>[0], 'ingestion_apify_post', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
    const supabase = await createClient();
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ingestionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
    }

    const { organizationId, projectId, searchUrl, resultsLimit } = parsed.data;

    // Validate project/org access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
    }

    const queue = createQueue(QUEUE_NAMES.APIFY_INGESTION);
    
    // Idempotency-Key support could be added here if passed in headers
    const idempotencyKey = request.headers.get('Idempotency-Key') || undefined;

    const jobData: ApifyIngestionJobData = {
      organizationId,
      projectId,
      source: 'apify',
      actorId: 'automation-lab/facebook-ads-library',
      searchUrl,
      resultsLimit
    };

    const job = await queue.add('ingest-facebook-ads', jobData, {
      jobId: idempotencyKey, // Prevents duplicate jobs if same key is used
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    await queue.close();

    return NextResponse.json({ 
      status: 'queued', 
      jobId: job.id 
    }, { status: 202 });

  } catch (error: unknown) {
    console.error('Apify ingestion trigger failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
