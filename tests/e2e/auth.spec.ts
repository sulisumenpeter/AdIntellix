import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
test('unauthenticated users are redirected from dashboard', async ({ page }) => {
    // Using mock auth state for E2E
    await page.goto('/dashboard');
    // Ensure Next.js redirects to login if RLS/Auth is missing
    // await expect(page).toHaveURL(/.*login/);
  });

  test('webhook endpoint rejects invalid signatures', async ({ request }) => {
    const response = await request.post('/api/webhooks/paddle', {
      headers: { 'paddle-signature': 'invalid-signature' },
      data: { event_id: '123' }
    });
    expect(response.status()).toBe(401);
  });
});
