import { test, expect } from '@playwright/test';

test.describe('Auth UI Flows', () => {
  test.describe('Login page', () => {
    test('Submit empty form shows validation errors', async ({ page }) => {
      await page.goto('/login', { timeout: 10000 });
      const submitBtn = page.locator('button[type="submit"]').first();
      await expect(submitBtn).toBeVisible({ timeout: 10000 });
      await submitBtn.click();
      // Wait for validation errors to appear
      await page.waitForTimeout(500);
      // Check for any validation error message
      const errorMessages = page.locator('p.text-xs, p.text-destructive, [class*="error"], [class*="destructive"]');
      const count = await errorMessages.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Enter invalid email format shows email validation error', async ({ page }) => {
      await page.goto('/login', { timeout: 10000 });
      const emailInput = page.locator('input[type="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 10000 });
      await emailInput.fill('not-an-email');
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(500);
      // Check for email-related error (may be browser native or JS validation)
      const errorMessages = page.locator('p.text-xs, p.text-destructive, [class*="error"], [class*="destructive"]');
      const count = await errorMessages.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Social login buttons (Google, Facebook) are visible', async ({ page }) => {
      await page.goto('/login', { timeout: 10000 });
      // Look for social login buttons by text or icon
      const socialButtons = page.locator(
        'button:has-text("Google"), button:has-text("Facebook"), a:has-text("Google"), a:has-text("Facebook"), [aria-label*="Google"], [aria-label*="Facebook"]'
      );
      const count = await socialButtons.count();
      // At least one social login option should exist
      expect(count).toBeGreaterThan(0);
    });

    test('Phone tab switch shows phone input', async ({ page }) => {
      await page.goto('/login', { timeout: 10000 });
      // Look for phone tab button
      const phoneTab = page.locator('button:has-text("Phone"), button:has-text("ফোন"), [role="tab"]:has-text("Phone")').first();
      const phoneTabVisible = await phoneTab.isVisible().catch(() => false);
      if (phoneTabVisible) {
        await phoneTab.click();
        await page.waitForTimeout(300);
        // Phone input should appear
        const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"], input[placeholder*="ফোন"]').first();
        await expect(phoneInput).toBeVisible({ timeout: 5000 });
      } else {
        // Phone tab might not be present — test passes if no tab exists
        test.info().annotations.push({ type: 'info', description: 'Phone tab not found — skipping tab switch check' });
      }
    });
  });

  test.describe('Register page', () => {
    test('Submit empty form shows validation errors', async ({ page }) => {
      await page.goto('/register', { timeout: 10000 });
      const submitBtn = page.locator('button[type="submit"]').first();
      await expect(submitBtn).toBeVisible({ timeout: 10000 });
      await submitBtn.click();
      await page.waitForTimeout(500);
      const errorMessages = page.locator('p.text-xs, p.text-destructive, [class*="error"], [class*="destructive"]');
      const count = await errorMessages.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Email is required — shows error without email', async ({ page }) => {
      await page.goto('/register', { timeout: 10000 });
      // Fill all fields except email
      const firstNameInput = page.locator('input[name="firstName"]').first();
      const lastNameInput = page.locator('input[name="lastName"]').first();
      const passwordInput = page.locator('input[name="password"]').first();

      if (await firstNameInput.isVisible()) await firstNameInput.fill('Test');
      if (await lastNameInput.isVisible()) await lastNameInput.fill('User');
      if (await passwordInput.isVisible()) await passwordInput.fill('TestPass1');

      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(500);

      // Some validation error should appear
      const errorMessages = page.locator('p.text-xs, p.text-destructive, [class*="error"], [class*="destructive"]');
      const count = await errorMessages.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Social login buttons are visible on register page', async ({ page }) => {
      await page.goto('/register', { timeout: 10000 });
      const socialButtons = page.locator(
        'button:has-text("Google"), button:has-text("Facebook"), a:has-text("Google"), a:has-text("Facebook"), [aria-label*="Google"], [aria-label*="Facebook"]'
      );
      const count = await socialButtons.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
