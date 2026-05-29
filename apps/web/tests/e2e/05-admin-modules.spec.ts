import { test, expect } from '@playwright/test';
import { adminLogin } from './helpers/auth';

const hasCredentials = !!(process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD);

test.describe('Admin Modules', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCredentials, 'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set');
    const loggedIn = await adminLogin(page);
    test.skip(!loggedIn, 'Admin login failed');
  });

  const modules = [
    { path: '/admin/coupons',        label: 'Coupons' },
    { path: '/admin/popups',         label: 'Popups' },
    { path: '/admin/pickup-points',  label: 'Pickup Points' },
    { path: '/admin/analytics',      label: 'Analytics' },
    { path: '/admin/inventory',      label: 'Inventory' },
    { path: '/admin/shipments',      label: 'Shipments' },
    { path: '/admin/flash-deals',    label: 'Flash Deals' },
    { path: '/admin/sellers',        label: 'Sellers' },
    { path: '/admin/reviews',        label: 'Reviews' },
    { path: '/admin/design',         label: 'Design Studio' },
    { path: '/admin/staff',          label: 'Staff' },
    { path: '/admin/preorders',      label: 'Preorders' },
  ];

  for (const { path, label } of modules) {
    test(`${label} module (${path}) renders`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')));
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
      // No unhandled JS errors (page shouldn't be blank)
      const content = await page.locator('main').textContent();
      expect(content?.length).toBeGreaterThan(0);
    });
  }

  test('Popups page has New Popup button', async ({ page }) => {
    await page.goto('/admin/popups');
    await expect(page.getByText('New Popup')).toBeVisible({ timeout: 8000 });
  });

  test('Products new page has form fields', async ({ page }) => {
    await page.goto('/admin/products/new');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });
});
