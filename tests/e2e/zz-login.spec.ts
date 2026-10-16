import { test, expect } from '@playwright/test';

test.describe('Login', () => {
test.use({ storageState: { cookies: [], origins: [] } });

  test('User login, dashboard data, session, and logout flow', async ({ page }) => {
    test.setTimeout(60000);
    const baseURL = 'http://localhost:3000';
    
    // FIX: Intercept token response to remove Date header and fix clock drift
    await page.route('**/auth/v1/token?grant_type=password', async route => {
      const response = await route.fetch();
      const headers = response.headers();
      delete headers['date'];
      await route.fulfill({ response, headers });
    });

    // 1. Open the login page
    await page.goto(`${baseURL}/login`);
    await expect(page.locator('h2', { hasText: 'Welcome back' })).toBeVisible();

    // 2. Log in with the Supabase Auth credentials
    await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_TEST_PASSWORD as string);
    await page.click('button[type="submit"]');

    // 3 & 4. Confirm authentication succeeds and redirects to protected dashboard
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // 5. Confirm the dashboard loads the user's organization
    await expect(page.getByText('Demo Organization')).toBeVisible({ timeout: 10000 });

    // 7. Confirm the projects section or empty state is visible
    await expect(page.getByText(/Project/i).first()).toBeVisible({ timeout: 10000 });

    // 8. Refresh the page and confirm the session persists
    await page.reload();
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Demo Organization')).toBeVisible({ timeout: 10000 });

    // 9. Log out
    await page.click('button:has-text("Log out")');

    // 10. Confirm protected dashboard access is denied after logout
    await page.waitForURL(/.*\/login/, { timeout: 15000 });
    await page.goto(`${baseURL}/dashboard`);
    await expect(page).toHaveURL(/.*\/login/, { timeout: 15000 });

    // 11. Log back in and confirm access is restored
    await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_TEST_PASSWORD as string);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Demo Organization')).toBeVisible({ timeout: 10000 });
  });
});
