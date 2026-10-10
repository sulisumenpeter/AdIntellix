import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../src/app/api/webhooks/paddle/route';
import { env } from '../../src/lib/env';
import crypto from 'crypto';

vi.mock('../../src/lib/rate-limit', () => ({
  rateLimitRequest: vi.fn(async () => ({ success: true })),
  RATE_LIMITS: { EXPENSIVE: 10 }
}));

const { mockSet } = vi.hoisted(() => ({
  mockSet: vi.fn(async (...args: unknown[]) => 'OK' as string | null)
}));

vi.mock('../../src/lib/redis/valkey', () => ({
  valkey: {
    set: mockSet
  }
}));

const { mockSupabaseFrom, mockSelect, mockInsert, mockUpdate, mockUpsert, mockEq, mockSingle, mockIs } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockUpsert = vi.fn();

  // Create a chainable mock object for the query builder
  const chainable = {
    eq: vi.fn(),
    is: vi.fn(),
    select: vi.fn(),
    single: mockSingle,
    maybeSingle: mockSingle
  };
  
  // Make methods return the chainable object itself
  chainable.eq.mockReturnValue(chainable);
  chainable.is.mockReturnValue(chainable);
  chainable.select.mockReturnValue(chainable);

  const mockUpdate = vi.fn(() => chainable);
  
  const mockSupabaseFrom = vi.fn((table: string) => {
    return {
      select: vi.fn(() => chainable),
      insert: mockInsert,
      update: mockUpdate,
      upsert: mockUpsert
    };
  });
  
  return { mockSupabaseFrom, mockSelect: chainable.select, mockInsert, mockUpdate, mockUpsert, mockEq: chainable.eq, mockSingle, mockIs: chainable.is };
});

vi.mock('../../src/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockSupabaseFrom
  }))
}));

function generateSignature(body: string, secret: string) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const signedPayload = `${ts}:${body}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload);
  return `ts=${ts};h1=${hmac.digest('hex')}`;
}

import { paddle } from '../../src/lib/paddle/paddle-client';

describe('Paddle Webhook API POST with Idempotency', () => {
  beforeEach(() => {
    env.PADDLE_WEBHOOK_SECRET = 'paddle-secret';
    mockSet.mockReset();
    mockSet.mockImplementation(async () => 'OK');
    
    // Mock the verifySignature to use the latest secret and avoid module-load binding issues
    vi.spyOn(paddle, 'verifySignature').mockImplementation((sig: string, body: string) => {
      if (!env.PADDLE_WEBHOOK_SECRET || !sig) return false;
      try {
        const parts = sig.split(';');
        const tsPart = parts.find((p: string) => p.startsWith('ts='));
        const h1Part = parts.find((p: string) => p.startsWith('h1='));
        if (!tsPart || !h1Part) return false;
        
        const ts = tsPart.split('=')[1];
        const signature = h1Part.split('=')[1];
        
        const signedPayload = `${ts}:${body}`;
        const hmac = crypto.createHmac('sha256', env.PADDLE_WEBHOOK_SECRET);
        hmac.update(signedPayload);
        const expectedSignature = hmac.digest('hex');
        
        const a = Buffer.from(signature);
        const b = Buffer.from(expectedSignature);
        return a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch {
        return false;
      }
    });

    mockSingle.mockReset();
    mockSingle.mockResolvedValue({ data: null });
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ error: null });
    mockUpdate.mockReset();
    mockUpsert.mockReset();
    mockUpsert.mockResolvedValue({ error: null });
  });

  const createReq = (bodyObj: unknown, overrideSig?: string, headers: Record<string, string> = {}) => {
    const rawBody = typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj);
    const signature = overrideSig !== undefined ? overrideSig : generateSignature(rawBody, 'paddle-secret');
    const finalHeaders: Record<string, string> = {
      'content-type': 'application/json',
      ...headers
    };
    if (signature !== null) {
      finalHeaders['paddle-signature'] = signature;
    }
    
    return new Request('http://localhost/api/webhooks/paddle', {
      method: 'POST',
      headers: finalHeaders,
      body: rawBody
    });
  };

  it('should process valid webhook successfully', async () => {
    const req = createReq({
      event_id: 'evt_1',
      event_type: 'subscription.created',
      data: { id: 'sub_1', customer_id: 'cus_1', status: 'active', custom_data: { organization_id: '550e8400-e29b-41d4-a716-446655440000' } }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    // Verified it updated the status to processed
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should reject missing signature', async () => {
    const req = new Request('http://localhost/api/webhooks/paddle', {
      method: 'POST',
      body: JSON.stringify({ event_id: 'evt_2', event_type: 'subscription.created' })
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should reject invalid signature', async () => {
    const req = createReq({ event_id: 'evt_3' }, 'ts=123;h1=invalid');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should reject malformed JSON', async () => {
    const req = createReq('{ invalid ');
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should reject oversized payload', async () => {
    const req = createReq({}, undefined, { 'content-length': '6000000' });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('should handle valkey idempotency (duplicate events fast path)', async () => {
    mockSet.mockImplementationOnce(async () => null); // Already processed in Valkey
    const req = createReq({ event_id: 'evt_dup', event_type: 'subscription.created', data: {} });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockSingle).not.toHaveBeenCalled(); // Didn't even hit DB
  });

  it('should handle DB duplicate event deliveries (concurrent check)', async () => {
    // Valkey passes, but DB says it's processed
    mockSingle.mockResolvedValueOnce({ data: { status: 'processed' } });
    const req = createReq({ event_id: 'evt_4', event_type: 'subscription.created', data: {} });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('should handle DB concurrent delivery (insert unique violation)', async () => {
    // DB returns null initially (no row), but insert fails with unique violation
    mockInsert.mockResolvedValueOnce({ error: { code: '23505' } });
    const req = createReq({ event_id: 'evt_5', event_type: 'subscription.created', data: {} });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled(); // Stops early
  });

  it('should permit safe retry after processing failure', async () => {
    // DB says it failed before
    mockSingle.mockResolvedValueOnce({ data: { status: 'failed' } });
    mockSelect.mockResolvedValueOnce({ data: [{ id: '1' }] }); // Simulate successful atomic claim
    const req = createReq({ event_id: 'evt_6', event_type: 'subscription.created', data: { custom_data: { organization_id: '550e8400-e29b-41d4-a716-446655440000' } } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    // It should have updated to pending, then processed
    expect(mockUpdate).toHaveBeenCalledTimes(2); 
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('should handle database failure gracefully during business logic', async () => {
    mockUpsert.mockRejectedValueOnce(new Error('DB failure'));
    const req = createReq({ event_id: 'evt_7', event_type: 'subscription.created', data: { custom_data: { organization_id: '550e8400-e29b-41d4-a716-446655440000' } } });
    const res = await POST(req);
    expect(res.status).toBe(500);
    // It should have marked it as failed
    expect(mockUpdate).toHaveBeenCalled(); // to update status to failed
  });

  it('should recover stale pending events (worker crash)', async () => {
    // 10 minutes ago
    const staleTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    mockSingle.mockResolvedValueOnce({ data: { status: 'pending', processing_started_at: staleTime } });
    mockSelect.mockResolvedValueOnce({ data: [{ id: '1' }] }); // Simulate successful atomic claim

    const req = createReq({ event_id: 'evt_8', event_type: 'subscription.created', data: { custom_data: { organization_id: '550e8400-e29b-41d4-a716-446655440000' } } });
    const res = await POST(req);
    
    expect(res.status).toBe(200);
    // Update called to claim lock, then processed
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('should prevent concurrent claims for stale pending events', async () => {
    const staleTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    mockSingle.mockResolvedValueOnce({ data: { status: 'pending', processing_started_at: staleTime } });
    // Simulate another worker claimed it just before us
    mockSelect.mockResolvedValueOnce({ data: [] }); 

    const req = createReq({ event_id: 'evt_9', event_type: 'subscription.created', data: { custom_data: { organization_id: '550e8400-e29b-41d4-a716-446655440000' } } });
    const res = await POST(req);
    
    expect(res.status).toBe(200);
    // Shouldn't do business logic
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
