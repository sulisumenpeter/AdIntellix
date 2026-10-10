import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorizeOrganization } from '../../src/lib/authorization';

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('../../src/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle
          })
        })
      })
    })
  }))
}));

describe('authorizeOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validOrgId = '550e8400-e29b-41d4-a716-446655440000';
  const validUserId = '11111111-1111-1111-1111-111111111111';

  it('should return invalid_org_id for invalid UUIDs', async () => {
    const result = await authorizeOrganization('not-a-uuid');
    expect(result).toEqual({ authorized: false, error: 'invalid_org_id' });
  });

  it('should return unauthenticated if getUser fails or returns no user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Auth err') });
    const result = await authorizeOrganization(validOrgId);
    expect(result).toEqual({ authorized: false, error: 'unauthenticated' });
  });

  it('should return forbidden_not_member if user is not a member', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: validUserId } }, error: null });
    mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Not found') });
    
    const result = await authorizeOrganization(validOrgId);
    expect(result).toEqual({ authorized: false, error: 'forbidden_not_member' });
  });

  it('should return forbidden_insufficient_role if user lacks required role', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: validUserId } }, error: null });
    mockSingle.mockResolvedValueOnce({ data: { role: 'viewer' }, error: null });
    
    const result = await authorizeOrganization(validOrgId, ['admin', 'owner']);
    expect(result).toEqual({ authorized: false, error: 'forbidden_insufficient_role' });
  });

  it('should return success if authenticated and authorized', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: validUserId } }, error: null });
    mockSingle.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });
    
    const result = await authorizeOrganization(validOrgId, ['admin']);
    expect(result).toEqual({
      authorized: true,
      user: { id: validUserId },
      role: 'admin',
      organizationId: validOrgId
    });
  });
});
