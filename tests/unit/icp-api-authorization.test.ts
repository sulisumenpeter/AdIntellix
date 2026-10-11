import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as profilesPOST, GET as profilesGET } from '../../src/app/api/icp/profiles/route';
import { POST as exportPOST } from '../../src/app/api/icp/export/route';
import { NextRequest } from 'next/server';
import { authorizeOrganization } from '../../src/lib/authorization';

vi.mock('../../src/lib/authorization', () => ({
  authorizeOrganization: vi.fn(),
  requireProjectOwnership: vi.fn(async () => true),
}));

vi.mock('../../src/lib/supabase/server', () => ({
  createApiClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          single: vi.fn().mockResolvedValue({ data: { id: 'mocked' }, error: null }),
          then: (cb: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(cb)
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'new-mocked' }, error: null })
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      }))
    }))
  }))
}));

vi.mock('../../src/lib/rate-limit', () => ({
  rateLimitRequest: vi.fn(async () => ({ success: true })),
  RATE_LIMITS: { DEFAULT: 10 }
}));

vi.mock('../../src/lib/queue/client', () => ({
  createQueue: vi.fn(() => ({
    add: vi.fn(async () => ({ id: 'mock-job-id' }))
  })),
  QUEUE_NAMES: { ICP_LEAD_IMPORT: 'icp-lead-import', ICP_REPORT_GENERATION: 'icp-report-generation' }
}));

describe('ICP API Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validOrgId = '550e8400-e29b-41d4-a716-446655440000';
  const otherOrgId = '660e8400-e29b-41d4-a716-446655440001';

  const createReq = (url: string, method: string, body?: unknown) => {
    return new NextRequest(url, {
      method,
      headers: {
        'content-type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined
    });
  };

  it('should reject unauthenticated requests across all endpoints', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: false, error: 'unauthenticated' });
    const req = createReq(`http://localhost/api/icp/profiles?organizationId=${validOrgId}`, 'GET');
    const res = await profilesGET(req);
    expect(res.status).toBe(401);
  });

  it('should reject authenticated users who are not org members', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: false, error: 'forbidden_not_member' });
    const req = createReq(`http://localhost/api/icp/profiles?organizationId=${validOrgId}`, 'GET');
    const res = await profilesGET(req);
    expect(res.status).toBe(403);
  });

  it('should allow authorized members accessing their own records', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: true, user: { id: 'u1' }, role: 'member', organizationId: validOrgId });
    const req = createReq(`http://localhost/api/icp/profiles?organizationId=${validOrgId}`, 'GET');
    const res = await profilesGET(req);
    expect(res.status).toBe(200);
  });

  it('should reject administrative actions if role is insufficient', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: false, error: 'forbidden_insufficient_role' });
    const req = createReq('http://localhost/api/icp/profiles', 'POST', {
      organizationId: validOrgId,
      name: 'Test',
      industry: 'Software'
    });
    const res = await profilesPOST(req);
    expect(res.status).toBe(403);
  });

  it('should allow valid administrative requests', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: true, user: { id: 'u1' }, role: 'admin', organizationId: validOrgId });
    const req = createReq('http://localhost/api/icp/profiles', 'POST', {
      organizationId: validOrgId,
      name: 'Test',
      industry: 'Software'
    });
    const res = await profilesPOST(req);
    expect(res.status).toBe(200);
  });

  it('should reject requests referencing another organization', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: false, error: 'forbidden_not_member' });
    const req = createReq(`http://localhost/api/icp/profiles?organizationId=${otherOrgId}`, 'GET');
    const res = await profilesGET(req);
    expect(res.status).toBe(403);
  });

  it('should allow export POST for admin', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: true, user: { id: 'u1' }, role: 'admin', organizationId: validOrgId });
    const req = createReq('http://localhost/api/icp/export', 'POST', {
      organizationId: validOrgId,
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'csv'
    });
    const res = await exportPOST(req);
    expect(res.status).toBe(200);
  });

  it('should reject export POST for regular members', async () => {
    vi.mocked(authorizeOrganization).mockResolvedValueOnce({ authorized: false, error: 'forbidden_insufficient_role' });
    const req = createReq('http://localhost/api/icp/export', 'POST', {
      organizationId: validOrgId,
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'csv'
    });
    const res = await exportPOST(req);
    expect(res.status).toBe(403);
  });

});
