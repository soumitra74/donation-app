import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('Authentication', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.clearLocalStorage();
    await page.goto('/');
  });

  test('should display login form on initial load', async ({ page }) => {
    // Check if login form is visible
    await expect(page.locator('text=Donation Collection')).toBeVisible();
    await expect(page.locator('text=Sign in to start collecting donations')).toBeVisible();
    
    // Check form inputs
    await expect(page.locator('input[placeholder="Enter your email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should toggle between sign in and sign up modes', async ({ page }) => {
    // Initially should be in sign in mode
    await expect(page.locator('text=Sign in to start collecting donations')).toBeVisible();
    
    // Click to switch to sign up
    await page.click('text=Don\'t have an account? Sign up');
    await expect(page.locator('text=Create your volunteer account')).toBeVisible();
    
    // Click to switch back to sign in
    await page.click('text=Already have an account? Sign in');
    await expect(page.locator('text=Sign in to start collecting donations')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    
    // Should redirect to dashboard
    await expect(page.locator('text=Donation Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, Soumitra Ghosh')).toBeVisible();
  });

  test('should persist login state after page refresh', async ({ page }) => {
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('text=Donation Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, Soumitra Ghosh')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    
    // Click logout button
    await page.click('button:has-text("Logout")');
    
    // Should return to login form
    await expect(page.locator('text=Donation Collection')).toBeVisible();
    await expect(page.locator('text=Sign in to start collecting donations')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('button:has-text("Sign In")');
    
    // Form should still be visible (no submission)
    await expect(page.locator('text=Donation Collection')).toBeVisible();
  });

  test('should handle theme switching on login form', async ({ page }) => {
    // Test light theme (default)
    await expect(page.locator('button:has-text("Light")')).toHaveClass(/bg-white\/20/);
    
    // Switch to dark theme
    await testUtils.changeTheme('dark');
    await expect(page.locator('button:has-text("Dark")')).toHaveClass(/bg-white\/20/);
    
    // Switch to ambient theme
    await testUtils.changeTheme('ambient');
    await expect(page.locator('button:has-text("Ambient")')).toHaveClass(/bg-white\/20/);
  });

  test('should maintain theme preference after login', async ({ page }) => {
    // Set theme to dark
    await testUtils.changeTheme('dark');
    
    // Login
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    
    // Theme should persist
    await expect(page.locator('button:has-text("Dark")')).toHaveClass(/bg-white\/20/);
  });
});

