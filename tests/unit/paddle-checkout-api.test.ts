import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../src/app/api/billing/checkout/route';
import { NextRequest } from 'next/server';
import { paddle } from '../../src/lib/paddle/paddle-client';
import { authorizeOrganization } from '../../src/lib/authorization';

vi.mock('../../src/lib/rate-limit', () => ({
  rateLimitRequest: vi.fn(async () => ({ success: true })),
  RATE_LIMITS: { STANDARD: 10 }
}));

vi.mock('../../src/lib/authorization', () => ({
  authorizeOrganization: vi.fn(),
}));

describe('Paddle Checkout API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createReq = (bodyObj: unknown) => {
    return new NextRequest('http://localhost/api/billing/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(bodyObj)
    });
  };

  it('should reject unauthenticated or non-admin checkout requests', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: false, error: 'forbidden_insufficient_role' });
    const req = createReq({ organizationId: 'org-123', priceId: 'pri_123' });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('should securely bind organizationId and initiate paddle checkout', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: true, user: { id: 'u1' }, role: 'owner', organizationId: 'org-123' });
    
    vi.spyOn(paddle, 'createTransaction').mockResolvedValueOnce({ checkout: { url: 'https://checkout.paddle.com/123' } } as never);
    
    const req = createReq({ organizationId: 'org-123', priceId: 'pri_123' });
    const res = await POST(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.transaction.checkout.url).toBe('https://checkout.paddle.com/123');
    
    // Ensure organizationId is correctly passed to Paddle Client to prevent tampering
    expect(paddle.createTransaction).toHaveBeenCalledWith('org-123', 'pri_123', expect.any(String));
  });

  it('should reject invalid plans or failed paddle transactions', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: true, user: { id: 'u1' }, role: 'owner', organizationId: 'org-123' });
    
    vi.spyOn(paddle, 'createTransaction').mockRejectedValueOnce(new Error('Failed to create Paddle transaction: 400'));
    
    const req = createReq({ organizationId: 'org-123', priceId: 'pri_invalid' });
    const res = await POST(req);
    
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to create Paddle transaction: 400');
  });

  it('should require organizationId and priceId', async () => {
    const req = createReq({ organizationId: 'org-123' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
