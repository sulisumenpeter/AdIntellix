import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit } from '../../src/lib/redis/valkey';
import Redis from 'ioredis';

vi.mock('ioredis', () => {
  const mockEval = vi.fn();
  const mockOn = vi.fn();
  
  class MockRedis {
    eval = mockEval;
    on = mockOn;
  }
  
  return {
    default: MockRedis,
  };
});

describe('checkRateLimit', () => {
  let mockEval: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const redisInstance = new (Redis as unknown as { new(): { eval: typeof mockEval } })();
    mockEval = redisInstance.eval;
  });

  it('allows requests below the limit', async () => {
    // Mock the lua script returning 5
    mockEval.mockResolvedValueOnce('5');
    
    const res = await checkRateLimit('test_key', 10, 60);
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(5);
  });

  it('blocks requests over the limit', async () => {
    mockEval.mockResolvedValueOnce('11');
    
    const res = await checkRateLimit('test_key', 10, 60);
    expect(res.success).toBe(false);
    expect(res.remaining).toBe(0);
  });

  it('fails open if redis throws an error', async () => {
    mockEval.mockRejectedValueOnce(new Error('Redis is down'));
    
    const res = await checkRateLimit('test_key', 10, 60);
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(9);
  });
});
