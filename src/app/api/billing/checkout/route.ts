import { NextRequest, NextResponse } from 'next/server';
import { authorizeOrganization } from '../../../../lib/authorization';
import { rateLimitRequest, RATE_LIMITS } from '../../../../lib/rate-limit';
import { paddle } from '../../../../lib/paddle/paddle-client';
import { env } from '../../../../lib/env';

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'billing_checkout', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    const body = await req.json();
    const { organizationId, priceId } = body;

    if (!organizationId || !priceId) {
      return NextResponse.json({ error: 'Missing organizationId or priceId' }, { status: 400 });
    }

    const authResult = await authorizeOrganization(organizationId, ['admin', 'owner']);
    if (!authResult.authorized) {
      if (authResult.error === 'unauthenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (authResult.error === 'invalid_org_id') return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const returnUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?session_id={checkout_hash}`;

    const transaction = await paddle.createTransaction(organizationId, priceId, returnUrl);

    return NextResponse.json({ data: { transaction } });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
