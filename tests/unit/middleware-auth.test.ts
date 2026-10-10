import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from '../../src/middleware';
import { NextRequest } from 'next/server';

let mockUser: unknown = null;
let mockSession: unknown = null;

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: mockSession }, error: null }))
    }
  }))
}));

describe('Middleware Auth', () => {
  beforeEach(() => {
    mockUser = null;
    mockSession = null;
  });

  it('should clear spoofed x-user-id header', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-user-id': 'spoofed-user-id', 'x-user-token': 'spoofed-token' }
    });
    await middleware(req);
    expect(req.headers.get('x-user-id')).toBeNull();
    expect(req.headers.get('x-user-token')).toBeNull();
  });

  it('should handle missing x-user-id safely', async () => {
    const req = new NextRequest('http://localhost/api/test');
    await middleware(req);
    expect(req.headers.get('x-user-id')).toBeNull();
  });

  it('should handle invalid session safely', async () => {
    const req = new NextRequest('http://localhost/api/test');
    req.cookies.set('sb-auth-token', 'invalid-jwt-payload');
    await middleware(req);
    expect(req.headers.get('x-user-id')).toBeNull();
  });

  it('should extract valid session', async () => {
    // mock a valid user and session
    mockUser = { id: 'valid-user-123' };
    mockSession = { access_token: 'valid-access-token' };

    const req = new NextRequest('http://localhost/api/test');
    req.cookies.set('sb-auth-token', 'valid-cookie');
    
    await middleware(req);
    expect(req.headers.get('x-user-id')).toBe('valid-user-123');
    expect(req.headers.get('x-user-token')).toBe('valid-access-token');
  });
});
