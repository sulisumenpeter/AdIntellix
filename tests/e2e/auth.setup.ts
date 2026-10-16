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
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 20000 });

  // 4. Inject Playwright variables into localStorage
  await page.evaluate(() => {
    localStorage.setItem('adintelix_org_id', 'org-1');
    localStorage.setItem('adintelix_project_id', 'proj-1');
    localStorage.setItem('is_playwright', 'true');
  });

  // 5. Save storage state
  await page.context().storageState({ path: STORAGE_STATE });

  // 6. Fix clock-drift on saved Supabase session so it doesn't expire during tests
  const state = JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf-8'));
  for (const cookie of state.cookies) {
    if (cookie.name.includes('-auth-token')) {
      if (cookie.value.startsWith('base64-')) {
        const jsonStr = Buffer.from(cookie.value.slice(7), 'base64').toString('utf-8');
        const session = JSON.parse(jsonStr);
        session.expires_at = Math.round(Date.now() / 1000) + 86400;
        cookie.value = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64');
      }
    }
  }
  fs.writeFileSync(STORAGE_STATE, JSON.stringify(state, null, 2));
});
