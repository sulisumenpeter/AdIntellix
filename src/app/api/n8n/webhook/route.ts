import { requireOrganizationMember, requireProjectOwnership, requireResourceOwnership } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { z } from 'zod';
import { valkey } from '@/lib/redis/valkey';

const webhookSchema = z.object({
  action: z.enum(['report-delivered', 'collection-complete', 'crm-sync-status']),
  organizationId: z.string().uuid(),
  eventId: z.string().uuid(),
  data: z.any()
});

export async function POST(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'n8n_webhook_post', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Payload Too Large' }, { status: 413 });
    }

    const authHeader = req.headers.get('authorization');
    const expectedSecret = env.N8N_WEBHOOK_SECRET;

    if (!expectedSecret) {
      logger.error('N8N_WEBHOOK_SECRET is not configured on the server.');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providedToken = authHeader.replace('Bearer ', '');
    const a = Buffer.from(providedToken);
    const b = Buffer.from(expectedSecret);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let rawPayload;
    try {
      rawPayload = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
    }

    const parsed = webhookSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Bad Request', details: parsed.error.issues }, { status: 400 });
    }

    const { action, organizationId, eventId, data } = parsed.data;

    // Idempotency / Replay Protection
    const idempotencyKey = `n8n-webhook:${eventId}`;
    try {
      const set = await valkey.set(idempotencyKey, '1', 'EX', 86400, 'NX');
      if (!set) {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }
    } catch (e) {
      // Ignore Valkey failure but log it
    }

    const supabase = createAdminClient();

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    switch (action) {
      case 'report-delivered':
        break;
      case 'collection-complete':
        break;
      case 'crm-sync-status':
        break;
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
