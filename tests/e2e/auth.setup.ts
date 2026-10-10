import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const STORAGE_STATE = path.join(__dirname, '../../.playwright/user.json');

setup('authenticate', async ({ page }) => {
  // Ensure the directory exists
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  // 1. Open the login page
  await page.goto('/login');

  // 2. Log in
  await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL as string);
  await page.fill('input[name="password"]', process.env.E2E_TEST_PASSWORD as string);
  await page.click('button[type="submit"]');

  // 3. Wait until redirected to dashboard
  await page.waitForURL(/.*\/dashboard/);

  // 4. Inject Playwright variables into localStorage
  await page.evaluate(() => {
    localStorage.setItem('adintellix_selected_org', 'org-1');
    localStorage.setItem('adintellix_selected_project', 'proj-1');
    localStorage.setItem('is_playwright', 'true');
  });

  // 5. Save storage state
  await page.context().storageState({ path: STORAGE_STATE });
});
