import { test, expect } from '@playwright/test';

test.describe('Landing Page Match', () => {
test('should allow queuing a new match analysis', async ({ page }) => {
    // Provide a mocked response for the API
    await page.route('/api/landing-page-match', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, json: { success: true } });
      } else {
        await route.fulfill({ status: 200, json: { data: [] } });
      }
    });

    await page.goto('/dashboard/landing-page-match');
    
    // Wait for the UI to load
    await expect(page.locator('text=Analyze New Match')).toBeVisible();

    // Setup the form
    await page.fill('input[placeholder="Advertisement ID"]', 'ad-123');
    await page.fill('input[placeholder="Destination URL (Landing Page)"]', 'https://example.com/promo');

    // Submit
    page.on('dialog', dialog => dialog.accept()); // Automatically dismiss the alert
    await page.click('button:has-text("Analyze")');

    // Should reset fields
    await expect(page.locator('input[placeholder="Advertisement ID"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="Destination URL (Landing Page)"]')).toHaveValue('');
  });

  test('should display existing matches', async ({ page }) => {
    // Mock the GET request
    await page.route('**/api/landing-page-match*', async route => {
      await route.fulfill({
        status: 200,
        json: {
          data: [{
            id: 'match-1',
            destination_url: 'https://example.com/promo',
            overall_score: 95,
            hook_alignment: 100,
            offer_alignment: 90,
            cta_alignment: 100,
            messaging_alignment: 90,
            mismatches: ['Price missing on landing page'],
            supporting_evidence: 'Both mention a 50% discount.',
            recommendations: ['Add the explicit price.'],
            crawled_at: new Date().toISOString(),
            advertisements: {
              advertiser_name: 'Test Advertiser',
              ad_text: 'Buy now for 50% off!'
            }
          }]
        }
      });
    });

    await page.goto('/dashboard/landing-page-match');

    // Verify UI rendering
    await expect(page.locator('text=Test Advertiser')).toBeVisible();
    await expect(page.locator('text=Buy now for 50% off!')).toBeVisible();
    await expect(page.locator('text=95/100')).toBeVisible();
    await expect(page.locator('text=Price missing on landing page')).toBeVisible();
  });
});
