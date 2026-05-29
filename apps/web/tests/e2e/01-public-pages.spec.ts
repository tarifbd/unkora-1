import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('Home page loads', async ({ page }) => {
    await page.goto('/', { timeout: 10000 });
    await expect(page).toHaveTitle(/.+/);
    // Check that the page renders without crashing
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // Header should exist (nav or header element)
    const header = page.locator('header, nav, [role="banner"]').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('Products page loads', async ({ page }) => {
    await page.goto('/products', { timeout: 10000 });
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // Check that some product grid or list container is visible
    const grid = page.locator('main, [role="main"], .grid, ul').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('Product detail page handles gracefully (may 404)', async ({ page }) => {
    const response = await page.goto('/products/test-slug', { timeout: 10000 });
    // Page should render regardless of 200 or 404
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // Should not show a blank/broken page
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('Login page loads with required fields', async ({ page }) => {
    await page.goto('/login', { timeout: 10000 });
    // Email input
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    // Password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    // Sign In button
    const signInBtn = page.locator('button[type="submit"]').first();
    await expect(signInBtn).toBeVisible({ timeout: 10000 });
  });

  test('Register page loads with required fields', async ({ page }) => {
    await page.goto('/register', { timeout: 10000 });
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // firstName input
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="Name"], input[placeholder*="নাম"]').first();
    await expect(firstNameInput).toBeVisible({ timeout: 10000 });
    // email input
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    // password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
  });

  test('Maintenance page loads without error', async ({ page }) => {
    await page.goto('/maintenance', { timeout: 10000 });
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // Check page text is present
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(10);
  });
});
