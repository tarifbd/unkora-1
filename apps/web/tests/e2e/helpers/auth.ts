import { Page } from '@playwright/test';

export async function adminLogin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) return false;

  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/admin|\//, { timeout: 5000 }).catch(() => {});
  return true;
}
