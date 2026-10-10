import Redis from 'ioredis';
import { env } from '../env';

export const valkey = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

valkey.on('error', (err) => {
  console.warn('Valkey connection error, rate limiting will fail open:', err.message);
});

const fallbackStore = new Map<string, { count: number; reset: number }>();

export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const reset = now + windowSeconds * 1000;
  
  try {
    // Atomic fixed window rate limit using Lua script
    const script = `
      local current = redis.call("INCR", KEYS[1])
      if tonumber(current) == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      return current
    `;
    
    const countStr = await valkey.eval(script, 1, key, windowSeconds);
    const count = Number(countStr);
    
    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset
    };
  } catch (error) {
    // Fail safely and use in-memory fallback
    console.warn('Rate limit check failed, falling back to in-memory:', error instanceof Error ? error.message : error);
    
    const record = fallbackStore.get(key);
    if (!record || record.reset < now) {
      fallbackStore.set(key, { count: 1, reset });
      return { success: 1 <= limit, limit, remaining: Math.max(0, limit - 1), reset };
    }
    
    record.count += 1;
    return { success: record.count <= limit, limit, remaining: Math.max(0, limit - record.count), reset: record.reset };
  }
}
