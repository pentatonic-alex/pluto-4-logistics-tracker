import { test, expect } from '@playwright/test';

test.describe('Audit Log Feature', () => {
  test.describe('API Endpoints', () => {
    test('audit log requires authentication', async ({ request }) => {
      // Try to access audit endpoint without authentication
      const response = await request.get('/api/audit');

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('audit log with filters requires authentication', async ({ request }) => {
      // Try to access audit endpoint with filters
      const response = await request.get(
        '/api/audit?campaignId=cmp_test&startDate=2026-01-01&endDate=2026-12-31'
      );

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('audit log with pagination requires authentication', async ({ request }) => {
      // Try to access audit endpoint with pagination
      const response = await request.get('/api/audit?page=2&limit=50');

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  test.describe('Page Access', () => {
    test('unauthenticated users are redirected from audit page', async ({ page }) => {
      // Try to access audit page
      await page.goto('/audit');

      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });

    test('login page is accessible', async ({ page }) => {
      await page.goto('/login');

      // Verify login page loads
      await expect(page.locator('text=LEGO REPLAY')).toBeVisible();
    });
  });

  // These tests require authentication setup
  // They are skipped by default but can be enabled for manual testing
  // or when proper test authentication is configured
  test.describe('Authenticated Audit Log (requires auth setup)', () => {
    test.skip(true, 'Requires authentication setup');

    test('audit page shows table structure', async ({ page }) => {
      await page.goto('/audit');

      // Check for page header
      await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible();

      // Check for filter controls
      await expect(page.locator('text=Campaign')).toBeVisible();
      await expect(page.locator('text=Start Date')).toBeVisible();
      await expect(page.locator('text=End Date')).toBeVisible();

      // Check for table headers
      await expect(page.locator('th:has-text("Timestamp")')).toBeVisible();
      await expect(page.locator('th:has-text("Campaign")')).toBeVisible();
      await expect(page.locator('th:has-text("Corrected Event")')).toBeVisible();
      await expect(page.locator('th:has-text("Reason")')).toBeVisible();
      await expect(page.locator('th:has-text("Changes")')).toBeVisible();
      await expect(page.locator('th:has-text("User")')).toBeVisible();
    });

    test('navigation includes Audit Log link', async ({ page }) => {
      await page.goto('/');

      // Check for Audit Log in navigation
      await expect(page.locator('a:has-text("Audit Log")')).toBeVisible();

      // Click and verify navigation
      await page.click('a:has-text("Audit Log")');
      await expect(page).toHaveURL(/audit/);
    });

    test('campaign filter dropdown populates', async ({ page }) => {
      await page.goto('/audit');

      // Check that select has "All Campaigns" option
      const select = page.locator('select');
      await expect(select.locator('option:has-text("All Campaigns")')).toBeVisible();
    });

    test('date filters accept valid dates', async ({ page }) => {
      await page.goto('/audit');

      // Fill in date inputs
      await page.fill('input[type="date"]:first-of-type', '2026-01-01');
      await page.fill('input[type="date"]:last-of-type', '2026-12-31');

      // Dates should be accepted (no error state)
      await expect(page.locator('input[type="date"]:first-of-type')).toHaveValue('2026-01-01');
    });

    test('clear filters button appears when filters are set', async ({ page }) => {
      await page.goto('/audit');

      // Initially no clear button
      await expect(page.locator('button:has-text("Clear")')).not.toBeVisible();

      // Set a date filter
      await page.fill('input[type="date"]:first-of-type', '2026-01-01');

      // Clear button should appear
      await expect(page.locator('button:has-text("Clear")')).toBeVisible();
    });

    test('pagination controls work', async ({ page }) => {
      await page.goto('/audit');

      // If there are results, pagination should be visible
      const nextButton = page.locator('button:has-text("Next")');
      
      if (await nextButton.isVisible()) {
        // Click next page
        await nextButton.click();
        
        // URL should update with page param
        await expect(page).toHaveURL(/page=2/);
      }
    });

    test('campaign links navigate to campaign detail', async ({ page }) => {
      await page.goto('/audit');

      // If there are correction entries, clicking campaign should navigate
      const campaignLink = page.locator('a[href*="/campaigns/"]').first();
      
      if (await campaignLink.isVisible()) {
        await campaignLink.click();
        await expect(page).toHaveURL(/campaigns\/cmp_/);
      }
    });

    test('empty state shows when no corrections exist', async ({ page }) => {
      await page.goto('/audit');

      // Check for empty state message
      const noCorrections = page.locator('text=No corrections found');
      const table = page.locator('table');
      
      // Either empty state or table should be visible
      const hasEmptyState = await noCorrections.isVisible();
      const hasTable = await table.isVisible();
      
      expect(hasEmptyState || hasTable).toBe(true);
    });
  });
});

// Test API response structure
test.describe('Audit API Response Validation', () => {
  test('audit API returns correct content-type header', async ({ request }) => {
    // This test verifies the 401 response structure
    const response = await request.get('/api/audit');

    expect(response.status()).toBe(401);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('audit API error response has expected structure', async ({ request }) => {
    const response = await request.get('/api/audit');

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });
});
