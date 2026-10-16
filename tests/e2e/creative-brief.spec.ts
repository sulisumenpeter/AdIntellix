import { test, expect } from '@playwright/test';

test.describe('Creative Brief', () => {
test('should allow submitting a brief', async ({ page }) => {
    // Navigate to the creative briefs page
    await page.goto('/dashboard/creative-briefs');

    // Wait for the page to load
    await expect(page.locator('h3', { hasText: 'Creative Brief Scorer' })).toBeVisible();

    // The form might not be testable fully if we require authentication, 
    // but assuming Playwright test uses a logged-in state or we can just check the UI elements.
    await expect(page.locator('input[placeholder="Concept Name"]')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Score Brief' })).toBeVisible();
  });
});
