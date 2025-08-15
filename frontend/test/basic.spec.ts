import { test, expect } from '@playwright/test';

test.describe('Basic Functionality', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Check if the app loads
    await expect(page.locator('text=Donation Collection')).toBeVisible();
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/');
    
    // Check form inputs
    await expect(page.locator('input[placeholder="Enter your email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should be able to fill login form', async ({ page }) => {
    await page.goto('/');
    
    // Fill the form
    await page.fill('input[placeholder="Enter your email"]', 'soumitraghosh@hotmail.com');
    await page.fill('input[placeholder="Enter your password"]', '123');
    
    // Verify the values are filled
    await expect(page.locator('input[placeholder="Enter your email"]')).toHaveValue('soumitraghosh@hotmail.com');
    await expect(page.locator('input[placeholder="Enter your password"]')).toHaveValue('123');
  });

  test('should have theme selector', async ({ page }) => {
    await page.goto('/');
    
    // Check if theme buttons are present
    await expect(page.locator('button:has-text("Light")')).toBeVisible();
    await expect(page.locator('button:has-text("Dark")')).toBeVisible();
    await expect(page.locator('button:has-text("Ambient")')).toBeVisible();
  });

  test('should be able to login and see dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Fill the login form
    await page.fill('input[placeholder="Enter your email"]', 'soumitraghosh@hotmail.com');
    await page.fill('input[placeholder="Enter your password"]', '123');
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Donation Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, Soumitra Ghosh')).toBeVisible();
  });
});
