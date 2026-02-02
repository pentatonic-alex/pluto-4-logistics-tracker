import { test, expect } from '@playwright/test';

test.describe('Navigation (unauthenticated)', () => {
  test('login page has proper structure', async ({ page }) => {
    await page.goto('/login');
    
    // Check branding
    await expect(page.locator('text=LEGO REPLAY')).toBeVisible();
  });
});

test.describe('Public pages', () => {
  test('login page is accessible', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);
  });
});

// Note: Full navigation tests require authentication
// These would need a test user or auth mocking:
//
// test.describe('Navigation (authenticated)', () => {
//   test.beforeEach(async ({ page }) => {
//     // Login first
//     await page.goto('/login');
//     await page.fill('input[type="email"]', 'test@example.com');
//     await page.fill('input[type="password"]', 'testpassword');
//     await page.click('button[type="submit"]');
//     await page.waitForURL('/');
//   });
//
//   test('can navigate to dashboard', async ({ page }) => {
//     await expect(page.locator('text=Dashboard')).toBeVisible();
//   });
//
//   test('can navigate to new campaign', async ({ page }) => {
//     await page.click('text=New Campaign');
//     await expect(page).toHaveURL(/campaigns\/new/);
//   });
//
//   test('can navigate to archive', async ({ page }) => {
//     await page.click('text=Archive');
//     await expect(page).toHaveURL(/archive/);
//   });
// });
