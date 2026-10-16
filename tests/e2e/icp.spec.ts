import { test, expect } from '@playwright/test';

test.describe('Icp', () => {
test('Complete flow: Create ICP, Rules, Leads, and Reports', async ({ page }) => {
    test.setTimeout(120000);
    page.on('console', msg => {
      console.log(`BROWSER [${msg.type()}]:`, msg.text());
    });
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`NETWORK ERROR: ${response.status()} ${response.url()}`);
      }
    });
    
    page.on('dialog', async dialog => {
      await dialog.accept().catch(() => {});
    });

    // 1. Storage state handles login automatically
    // 2. Navigate to ICP Management
    await page.goto('/dashboard/icp');
    await page.waitForURL('/dashboard/icp');

    const uniqueICPName = `Enterprise Tech ICP ${Date.now()}`;
    await page.fill('input[name="name"]', uniqueICPName);

    await page.click('button:has-text("Create Profile")');
    
    // Wait for API to complete and UI to update (no reload)
    const testId = `profile-${uniqueICPName.replace(/\s+/g, '-')}`;
    const profileContainer = page.locator(`[data-testid="${testId}"]`);
    await expect(profileContainer).toBeVisible({ timeout: 10000 });

    // 4. Add Rule
    await profileContainer.locator('select[name="rule_type"]').selectOption('revenue');
    await profileContainer.locator('select[name="operator"]').selectOption('greater_than');
    await profileContainer.locator('input[name="value"]').fill('1000000');
    await profileContainer.locator('input[name="weight"]').fill('25');

    await profileContainer.locator('button:has-text("Add Rule")').click();
    
    // Wait for the rule to appear in the UI
    await expect(profileContainer.locator('li').filter({ hasText: '1000000' })).toBeVisible({ timeout: 10000 });

    // 5. Delete Rule
    await profileContainer.locator('button:has-text("X")').first().click();

    // Should be deleted
    await expect(profileContainer.locator('li').filter({ hasText: '1000000' })).not.toBeVisible({ timeout: 10000 });

    // Re-add rule for lead matching
    await profileContainer.locator('select[name="rule_type"]').selectOption('job_title');
    await profileContainer.locator('select[name="operator"]').selectOption('contains');
    await profileContainer.locator('input[name="value"]').fill('CEO');
    await profileContainer.locator('input[name="weight"]').fill('50');
    
    await profileContainer.locator('button:has-text("Add Rule")').click();

    await page.waitForTimeout(1000);
    await page.click('button:has-text("Refresh View")').catch(() => {});

    // Wait for the new rule to appear
    await expect(profileContainer.locator('li').filter({ hasText: 'CEO' })).toBeVisible({ timeout: 10000 });

    // 6. Upload CSV & Import Leads
    const csvContent = 'name,company,job_title\nJohn Doe,Acme Corp,CEO';
    await page.setInputFiles('input[type="file"]', {
      name: 'leads.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    
    await page.click('button:has-text("Import")');

    // Click refresh to load leads without full page reload and wait for workers to process
    await expect(async () => {
      await page.waitForTimeout(2000);
      await page.click('button:has-text("Refresh View")');
      await expect(page.locator('text=John Doe').first()).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });
    
    await expect(page.locator('text=Acme Corp').first()).toBeVisible({ timeout: 10000 });

    // 8. Navigate to Reports
    await page.goto('/dashboard/reports');

    await page.click('button:has-text("Generate CSV Export")');

    await expect(async () => {
      await page.waitForTimeout(2000);
      await page.click('button:has-text("Refresh Data")');
      await expect(page.locator('button:has-text("Download CSV")').first()).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 30000 });

    await expect(page.locator('text=Total Leads').first()).toBeVisible({ timeout: 10000 });

    const [csvDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download CSV")')
    ]);
    expect(csvDownload.suggestedFilename()).toBe('report.csv');

    await page.click('button:has-text("Generate PDF Export")');
    
    await expect(async () => {
      await page.waitForTimeout(2000);
      await page.click('button:has-text("Refresh Data")');
      await expect(page.locator('button:has-text("Download PDF")').first()).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 30000 });

    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download PDF")')
    ]);
    expect(pdfDownload.suggestedFilename()).toBe('report.pdf');
  });
});
