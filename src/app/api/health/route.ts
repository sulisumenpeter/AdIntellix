import { rateLimitRequest, RATE_LIMITS } from '../../../lib/rate-limit';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const rateLimit = await rateLimitRequest(req as unknown as Parameters<typeof rateLimitRequest>[0], 'health_get', RATE_LIMITS.DEFAULT);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimit.headers });
    }

    
      
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'adintelix-api'
  });
}
