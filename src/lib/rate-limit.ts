import { NextRequest } from 'next/server';
import { checkRateLimit } from './redis/valkey';
import { createClient } from './supabase/server';

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  DEFAULT: { limit: 100, windowSeconds: 60 }, // 100 req per minute
  AUTH: { limit: 10, windowSeconds: 60 }, // 10 req per minute for auth routes
  EXPENSIVE: { limit: 10, windowSeconds: 60 }, // 10 req per minute for AI/crawling/heavy queries
};

export async function rateLimitRequest(
  req: NextRequest,
  actionName: string,
  config: RateLimitConfig = RATE_LIMITS.DEFAULT
): Promise<{ success: boolean; headers: Headers }> {
  // Try to extract IP address
  const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
  
  // Try to extract User ID if authenticated
  const userId = req.headers.get('x-user-id') || 'unauthenticated';

  // Use user ID if authenticated, otherwise use IP
  const identifier = userId !== 'unauthenticated' ? `user:${userId}` : `ip:${ip}`;
  const key = `ratelimit:${actionName}:${identifier}`;

  const result = await checkRateLimit(key, config.limit, config.windowSeconds);

  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
  });

  if (!result.success) {
    headers.set('Retry-After', Math.ceil((result.reset - Date.now()) / 1000).toString());
  }

  return { success: result.success, headers };
}
