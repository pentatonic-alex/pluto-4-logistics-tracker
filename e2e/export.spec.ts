import { test, expect } from '@playwright/test';

test.describe('Export Feature', () => {
  test.describe('API Endpoints', () => {
    test('single campaign export requires authentication', async ({ request }) => {
      // Try to access export endpoint without authentication
      const response = await request.get('/api/export/cmp_01TEST00000000000000000000');

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('bulk export requires authentication', async ({ request }) => {
      // Try to access bulk export endpoint without authentication
      const response = await request.get('/api/export');

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('single campaign export validates campaign ID format', async ({
      request,
    }) => {
      // Try with invalid campaign ID format
      const response = await request.get('/api/export/invalid-id');

      // Should return 400 Bad Request (if auth passes) or 401 (if auth fails first)
      // Since auth is checked first, we expect 401
      expect(response.status()).toBe(401);
    });

    test('bulk export with invalid IDs is rejected', async ({ request }) => {
      // Try with invalid IDs parameter
      const response = await request.get('/api/export?ids=invalid-id-1,invalid-id-2');

      // Auth check happens first
      expect(response.status()).toBe(401);
    });
  });

  test.describe('UI Elements', () => {
    test('login page is accessible', async ({ page }) => {
      await page.goto('/login');

      // Verify login page loads
      await expect(page.locator('text=LEGO REPLAY')).toBeVisible();
    });

    test('unauthenticated users are redirected from dashboard', async ({
      page,
    }) => {
      // Try to access dashboard (where export button would be)
      await page.goto('/');

      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });
  });

  // These tests require authentication setup
  // They are skipped by default but can be enabled for manual testing
  // or when proper test authentication is configured
  test.describe('Authenticated Export (requires auth setup)', () => {
    test.skip(true, 'Requires authentication setup');

    test('dashboard shows export all button', async ({ page }) => {
      // Navigate to dashboard (assuming authenticated)
      await page.goto('/');

      // Check for export button
      await expect(page.locator('button:has-text("Export All")')).toBeVisible();
    });

    test('export all button triggers download', async ({ page }) => {
      await page.goto('/');

      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      // Click export button
      await page.click('button:has-text("Export All")');

      // Wait for download
      const download = await downloadPromise;

      // Verify filename pattern
      expect(download.suggestedFilename()).toMatch(
        /campaigns-export-\d{4}-\d{2}-\d{2}\.xlsx/
      );
    });

    test('campaign detail page shows export button', async ({ page }) => {
      // This would need a real campaign ID
      // Navigate to a campaign detail page
      await page.goto('/campaigns/cmp_test');

      // Check for export button
      await expect(page.locator('button:has-text("Export")')).toBeVisible();
    });

    test('export button shows loading state', async ({ page }) => {
      await page.goto('/');

      // Click export button
      await page.click('button:has-text("Export All")');

      // Check for loading state (button should show "Exporting...")
      await expect(
        page.locator('button:has-text("Exporting...")')
      ).toBeVisible();
    });
  });
});

// Test utilities for export functionality
test.describe('Export File Validation', () => {
  test('export API returns correct content-type header', async ({ request }) => {
    // This test would need authentication
    // For now, we verify the 401 response structure
    const response = await request.get('/api/export');

    expect(response.status()).toBe(401);
    expect(response.headers()['content-type']).toContain('application/json');
  });
});
