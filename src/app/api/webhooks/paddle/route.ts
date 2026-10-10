import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { NextResponse } from 'next/server';
import { paddle } from '@/lib/paddle/paddle-client';
import { logger } from '@/lib/observability/logger';
import { z } from 'zod';
import { valkey } from '@/lib/redis/valkey';

const paddleEventSchema = z.object({
  event_id: z.string(),
  event_type: z.string(),
  data: z.any()
}).passthrough();

export async function POST(req: Request) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'webhooks_paddle_post', RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Payload Too Large' }, { status: 413 });
    }

    const signature = req.headers.get('paddle-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const rawBody = await req.text();
    
    // Verify webhook authenticity
    if (!paddle.verifySignature(signature, rawBody)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let rawPayload;
    try {
      rawPayload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
    }

    const parsed = paddleEventSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Bad Request', details: parsed.error.issues }, { status: 400 });
    }

    const payload = parsed.data;
    const eventId = payload.event_id;
    const eventType = payload.event_type;

    // Fast idempotency / Replay Protection via Valkey
    const idempotencyKey = `paddle-webhook:${eventId}`;
    try {
      const set = await valkey.set(idempotencyKey, '1', 'EX', 86400, 'NX');
      if (!set) {
        return NextResponse.json({ received: true, message: 'Already processed' });
      }
    } catch (e) {
      // Ignore Valkey failure, paddle.processEvent has DB-level idempotency
    }

    // Process event idempotently in DB
    await paddle.processEvent(eventId, eventType, payload);

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
