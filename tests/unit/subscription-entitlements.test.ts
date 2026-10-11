import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../src/app/api/google-ads/search-terms/route';
import { NextRequest } from 'next/server';
import { authorizeOrganization, authorizeSubscription } from '../../src/lib/authorization';

vi.mock('../../src/lib/rate-limit', () => ({
  rateLimitRequest: vi.fn(async () => ({ success: true })),
  RATE_LIMITS: { EXPENSIVE: 10 }
}));

vi.mock('../../src/lib/authorization', () => ({
  authorizeOrganization: vi.fn(),
  authorizeSubscription: vi.fn(),
  requireProjectOwnership: vi.fn(async () => true),
}));

vi.mock('../../src/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { id: 'conn_1' }, error: null })
            }))
          }))
        }))
      }))
    }))
  }))
}));

vi.mock('../../src/lib/queue/client', () => ({
  createQueue: vi.fn(() => ({
    add: vi.fn(async () => ({ id: 'mock-job-id' })),
    close: vi.fn(async () => {})
  })),
  QUEUE_NAMES: { GOOGLE_ADS_IMPORT: 'google-ads-import' }
}));

describe('Subscription Entitlements Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createReq = (bodyObj: unknown) => {
    return new NextRequest('http://localhost/api/google-ads/search-terms', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(bodyObj)
    });
  };

  it('should deny access when entitlements are insufficient (free tier)', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: true, user: { id: 'u1' }, role: 'admin', organizationId: 'org-123' });
    vi.mocked(authorizeSubscription).mockResolvedValueOnce({ authorized: true, status: 'free', planId: null });

    const req = createReq({ organizationId: 'org-123', projectId: 'proj-123', connectionId: 'conn-123' });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Upgrade required for Google Ads syncing');
  });

  it('should deny access when subscription is expired', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: true, user: { id: 'u1' }, role: 'admin', organizationId: 'org-123' });
    vi.mocked(authorizeSubscription).mockResolvedValueOnce({ authorized: false, error: 'subscription_expired' });

    const req = createReq({ organizationId: 'org-123', projectId: 'proj-123', connectionId: 'conn-123' });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('should allow access when subscription is active', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: true, user: { id: 'u1' }, role: 'admin', organizationId: 'org-123' });
    vi.mocked(authorizeSubscription).mockResolvedValueOnce({ authorized: true, status: 'active', planId: 'pri_123' });

    const req = createReq({ organizationId: 'org-123', projectId: 'proj-123', connectionId: 'conn-123' });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
