import { describe, it, expect, vi } from 'vitest';
import { POST } from '../../src/app/api/icp/leads/route';
import { NextRequest } from 'next/server';

vi.mock('../../src/lib/rate-limit', () => ({
  rateLimitRequest: vi.fn(async () => ({ success: true })),
  RATE_LIMITS: { DEFAULT: 10 }
}));

vi.mock('../../src/lib/supabase/server', () => ({
  createApiClient: vi.fn(() => ({}))
}));

vi.mock('../../src/lib/authorization', () => ({
  requireProjectOwnership: vi.fn(async () => true),
  authorizeOrganization: vi.fn(async (orgId) => {
    if (!orgId) return { authorized: false, error: 'invalid_org_id' };
    return { authorized: true, user: { id: 'user-123' }, role: 'admin', organizationId: orgId };
  })
}));

vi.mock('../../src/lib/queue/client', () => ({
  createQueue: vi.fn(() => ({
    add: vi.fn(async () => ({ id: 'mock-job-id' }))
  })),
  QUEUE_NAMES: { ICP_LEAD_IMPORT: 'icp-lead-import' }
}));

describe('ICP Leads API POST', () => {
  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockProjectId = '123e4567-e89b-12d3-a456-426614174001';

  const createReq = (body: unknown, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost/api/icp/leads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        ...headers
      },
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  };

  it('should accept valid payload', async () => {
    const req = createReq({
      organizationId: mockOrgId,
      projectId: mockProjectId,
      rows: [{ name: 'Test User', email: 'test@example.com' }]
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.jobId).toBe('mock-job-id');
  });

  it('should reject malformed JSON', async () => {
    const req = createReq('{ invalid json ', { 'content-length': '20' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Malformed JSON');
  });

  it('should reject unsupported content type', async () => {
    const req = createReq({}, { 'content-type': 'text/plain' });
    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it('should reject oversized payload', async () => {
    const req = createReq({}, { 'content-length': '3000000' });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('should reject excessive rows', async () => {
    const req = createReq({
      organizationId: mockOrgId,
      projectId: mockProjectId,
      rows: Array(5001).fill({ name: 'User' })
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should reject missing organizationId', async () => {
    const req = createReq({
      projectId: mockProjectId,
      rows: [{ name: 'User' }]
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should reject invalid email in rows', async () => {
    const req = createReq({
      organizationId: mockOrgId,
      projectId: mockProjectId,
      rows: [{ email: 'not-an-email' }]
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('No valid rows found in CSV');
  });

  it('should allow valid empty email if literal string', async () => {
    const req = createReq({
      organizationId: mockOrgId,
      projectId: mockProjectId,
      rows: [{ email: '' }]
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('should reject empty rows array', async () => {
    const req = createReq({
      organizationId: mockOrgId,
      projectId: mockProjectId,
      rows: []
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
