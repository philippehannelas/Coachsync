import { test, expect } from '@playwright/test';

test('Admin dashboard loads after login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  const emailInput = page.locator('input[placeholder="Enter your email"]');
  await emailInput.waitFor({ timeout: 10000 });

  await emailInput.fill('admin@example.com');
  await page.locator('input[placeholder="Enter your password"]').fill('password');
  await page.locator('button[type="submit"]:has-text("Sign In")').click();

  await page.waitForURL('http://localhost:5173/admin/dashboard', { timeout: 10000 });

  await expect(page.locator('text=Users')).toBeVisible();

  await page.screenshot({ path: '/home/jules/verification/admin_dashboard.png' });
});
