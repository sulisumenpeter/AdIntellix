import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createQueue, QUEUE_NAMES } from '../../../lib/queue/client';

export async function POST(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'creative-briefs_post', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
    const supabase = await createClient();
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const input = await req.json();

    // Verify organization access
    // Replaced manual org check with centralized auth
await requireOrganizationMember(supabase, userId, input.organizationId);


    // Insert pending brief
    const { data: brief, error: insertError } = await supabase
      .from('creative_briefs')
      .insert({
        organization_id: input.organizationId,
        project_id: input.projectId,
        concept: input.concept,
        hook: input.hook,
        offer: input.offer,
        cta: input.cta,
        messaging_theme: input.messagingTheme,
        format: input.format,
        target_audience: input.targetAudience,
        destination_intent: input.destinationIntent,
        status: 'pending'
      })
      .select('id')
      .single();

    if (insertError || !brief) {
      throw insertError;
    }

    // Enqueue job
    const queue = createQueue(QUEUE_NAMES.CREATIVE_BRIEF_SCORING);
    await queue.add('score-brief', {
      briefId: brief.id,
      input
    });
    await queue.close();

    return NextResponse.json({ success: true, briefId: brief.id });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'creative-briefs_get', RATE_LIMITS.EXPENSIVE);
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
      .from('creative_briefs')
      .select('*')
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
