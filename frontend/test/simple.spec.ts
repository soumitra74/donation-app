import { test, expect } from '@playwright/test';

test.describe('Simple Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Check if the app loads
    await expect(page.locator('text=Donation Collection')).toBeVisible();
  });

  test('should display login form elements', async ({ page }) => {
    await page.goto('/');

    // Check login form elements
    await expect(page.locator('input[placeholder="Enter your email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should be able to interact with form', async ({ page }) => {
    await page.goto('/');

    // Fill the form
    await page.fill('input[placeholder="Enter your email"]', 'admin@donationapp.com');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');

    // Verify the values are filled
    await expect(page.locator('input[placeholder="Enter your email"]')).toHaveValue('admin@donationapp.com');
    await expect(page.locator('input[placeholder="Enter your password"]')).toHaveValue('admin123');
  });

  test('should have theme buttons', async ({ page }) => {
    await page.goto('/');

    // Check if theme buttons are present
    await expect(page.locator('button:has-text("Light")')).toBeVisible();
    await expect(page.locator('button:has-text("Dark")')).toBeVisible();
    await expect(page.locator('button:has-text("Ambient")')).toBeVisible();
  });

  test('should be able to login successfully', async ({ page }) => {
    await page.goto('/');
    
    // Fill the login form
    await page.fill('input[placeholder="Enter your email"]', 'admin@donationapp.com');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, System Administrator')).toBeVisible();
  });
});
