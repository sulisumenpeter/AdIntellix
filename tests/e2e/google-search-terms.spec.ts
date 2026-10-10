import { test, expect } from '@playwright/test';

test.describe('Google Search Terms', () => {
test('should connect google ads and import search terms', async ({ page }) => {
    let connectionsCallCount = 0;
    await page.route('**/api/google-ads/connections*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          json: { data: [{ id: 'conn-1', customer_id: '123-456' }] }
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, json: { success: true } });
      }
    });

    // Mock Search terms
    await page.route('**/api/google-ads/search-terms*', async route => {
      if (route.request().method() === 'GET') {
        if (connectionsCallCount === 0) { // before import completes
            connectionsCallCount++;
            await route.fulfill({ status: 200, json: { data: [] } });
        } else {
            await route.fulfill({
                status: 200,
                json: {
                data: [{
                    id: 'term-1',
                    search_term: 'shopify alternatives',
                    campaign: 'Competitors',
                    ad_group: 'Platforms',
                    impressions: 1500,
                    clicks: 45,
                    cost: 120.50,
                    conversions: 2,
                    conversion_value: 50,
                    classification: 'competitor',
                    relevance_score: 10,
                    waste_indicator: true,
                    explanation: 'Searching for a competitor platform',
                    suggested_negative_keyword: 'shopify'
                }]
                }
            });
        }
      } else if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, json: { success: true } });
      }
    });

    await page.goto('/dashboard/google-search-terms');

    // Should now show the import form
    // Wait for the connections API to load
    await page.waitForResponse(res => res.url().includes('/api/google-ads/connections') && res.status() === 200, { timeout: 10000 }).catch(() => {});
    
    await expect(page.locator('select').first()).toBeVisible();
    await page.locator('select').first().selectOption({ index: 1 });
    
    // Ensure button is enabled
    await expect(page.locator('button:has-text("Import Search Terms")')).toBeEnabled({ timeout: 5000 });
    await page.click('button:has-text("Import Search Terms")');

    // After import we need to click refresh because we mocked the flow via refresh button
    await page.click('button:has-text("Refresh")');
    
    // Verify search term is shown
    await expect(page.getByText('shopify alternatives')).toBeVisible();
    await expect(page.getByText('Searching for a competitor platform')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'shopify', exact: true })).toBeVisible(); // negative keyword
  });
});
