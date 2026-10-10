import { test, expect } from '@playwright/test';

test.describe('Patterns', () => {
test('can navigate to Ad Patterns and view pattern data', async ({ page }) => {
    // Navigate to Ad Patterns
    await page.goto('/dashboard');
    await page.click('a:has-text("Ad Patterns")');
    await expect(page).toHaveURL(/\/dashboard\/patterns/);

    // Verify the page title
    await expect(page.locator('h3', { hasText: 'Ad Pattern Intelligence' })).toBeVisible();

    // Verify the sections are present
    await expect(page.locator('h4', { hasText: 'Recurring Hooks' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Recurring Offers' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Recurring CTAs' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Messaging Themes' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Long-Running Ads (>14 Days)' })).toBeVisible();

    // Verify the empty state or table for Long-Running Ads
    const tableVisible = await page.locator('table').isVisible();
    if (tableVisible) {
      await expect(page.locator('th', { hasText: 'Advertiser' })).toBeVisible();
      await expect(page.locator('th', { hasText: 'Duration' })).toBeVisible();
      await expect(page.locator('th', { hasText: 'Ad Copy Snippet' })).toBeVisible();
    } else {
      await expect(page.locator('text=No long-running ads detected.')).toBeVisible();
    }
  });
});
