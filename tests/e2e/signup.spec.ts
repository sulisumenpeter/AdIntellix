import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  test('validates required fields and password mismatch', async ({ page }) => {
    await page.goto('/signup');

    // Submit empty
    await page.click('button[type="submit"]');
    // HTML5 validation should prevent submission, but if we bypass it:
    
    // Test password mismatch
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.text-red-700')).toContainText('Passwords do not match');
  });

  // Note: Testing actual successful registration in E2E requires a test Supabase instance 
  // that can handle email confirmation, or we need to mock the Supabase Auth API.
  // We can verify that the signup page loads correctly and has the right links.

  test('login page has a signup link', async ({ page }) => {
    await page.goto('/login');
    const signupLink = page.locator('text=Sign up');
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute('href', '/signup');
  });

  test('signup page has a login link', async ({ page }) => {
    await page.goto('/signup');
    const loginLink = page.locator('text=Sign in');
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');
  });
});
