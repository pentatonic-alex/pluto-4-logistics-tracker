import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check branding and form elements
    await expect(page.locator('text=LEGO REPLAY')).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message (stay on login page or show error)
    await expect(page).toHaveURL(/login/);
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
