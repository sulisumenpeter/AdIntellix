import { test, expect } from '@playwright/test';

test.describe('Rate Limit', () => {
test('returns 429 and Retry-After when limits are exceeded on unauthenticated endpoints', async ({ request }) => {
    // Pick an endpoint that has EXPENSIVE rate limits (e.g. /api/landing-page-match)
    // We send requests in a loop until we hit 429
    let rateLimited = false;
    let headers: Record<string, string> = {};
    let status = 200;
    
    // Send up to 15 requests (EXPENSIVE limit is 10)
    for (let i = 0; i < 15; i++) {
      const response = await request.post('/api/landing-page-match', {
        data: { url: 'https://example.com' },
      });
      
      status = response.status();
      if (status === 429) {
        rateLimited = true;
        headers = response.headers();
        break;
      }
    }
    
    expect(rateLimited).toBe(true);
    expect(headers['retry-after']).toBeDefined();
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBe('0');
  });
});
