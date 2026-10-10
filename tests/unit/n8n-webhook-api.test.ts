import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../src/app/api/n8n/webhook/route';
import { env } from '../../src/lib/env';

vi.mock('../../src/lib/rate-limit', () => ({
  rateLimitRequest: vi.fn(async () => ({ success: true })),
  RATE_LIMITS: { EXPENSIVE: 10 }
}));

vi.mock('../../src/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn((key, val) => ({
          single: vi.fn(async () => {
            if (val === '123e4567-e89b-12d3-a456-426614174000') return { data: { id: val } };
            return { error: 'Not found' };
          })
        }))
      }))
    }))
  }))
}));

const { mockSet } = vi.hoisted(() => ({
  mockSet: vi.fn(async (...args: unknown[]) => 'OK' as string | null)
}));

vi.mock('../../src/lib/redis/valkey', () => ({
  valkey: {
    set: mockSet
  }
}));

describe('N8N Webhook API', () => {
  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockEventId = '123e4567-e89b-12d3-a456-426614174111';
  
  beforeEach(() => {
    env.N8N_WEBHOOK_SECRET = 'valid-secret';
    mockSet.mockReset();
    mockSet.mockImplementation(async () => 'OK');
  });

  const createReq = (body: unknown, headers: Record<string, string> = {}) => {
    return new Request('http://localhost/api/n8n/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer valid-secret',
        ...headers
      },
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  };

  it('should process valid webhook', async () => {
    const req = createReq({
      action: 'report-delivered',
      organizationId: mockOrgId,
      eventId: mockEventId,
      data: { success: true }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('should reject invalid secret', async () => {
    const req = createReq({
      action: 'report-delivered',
      organizationId: mockOrgId,
      eventId: mockEventId,
      data: {}
    }, { authorization: 'Bearer invalid-secret' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should reject missing authorization', async () => {
    const req = new Request('http://localhost/api/n8n/webhook', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should handle missing authorization explicitly', async () => {
    const req = createReq({
      action: 'report-delivered',
      organizationId: mockOrgId,
      eventId: mockEventId,
      data: {}
    });
    req.headers.delete('authorization');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should reject malformed JSON', async () => {
    const req = createReq('{ invalid json ', { 'content-length': '20' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should reject invalid action', async () => {
    const req = createReq({
      action: 'delete-database',
      organizationId: mockOrgId,
      eventId: mockEventId,
      data: {}
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should reject non-existent organization (cross-tenant attempt)', async () => {
    const req = createReq({
      action: 'report-delivered',
      organizationId: '123e4567-e89b-12d3-a456-426614174999',
      eventId: mockEventId,
      data: {}
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('should handle idempotency (replay protection)', async () => {
    mockSet.mockImplementationOnce(async () => null); // Simulate already processed
    
    const req = createReq({
      action: 'report-delivered',
      organizationId: mockOrgId,
      eventId: mockEventId,
      data: {}
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('Already processed');
  });

  it('should reject oversized payload', async () => {
    const req = createReq({}, { 'content-length': '6000000' });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });
});
