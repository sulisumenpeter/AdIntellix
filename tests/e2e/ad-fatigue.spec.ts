import { test, expect } from '@playwright/test';

test.describe('Ad Fatigue', () => {
test('should display ad fatigue reports', async ({ page }) => {
    // Navigate to the ad fatigue page
    await page.goto('/dashboard/ad-fatigue');

    // Wait for the page to load
    await expect(page.locator('h3', { hasText: 'Ad Fatigue Detection' })).toBeVisible();

    // Check if the refresh button is visible
    await expect(page.locator('button', { hasText: 'Refresh Data' })).toBeVisible();
  });
});
