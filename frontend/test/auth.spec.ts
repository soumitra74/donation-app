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
    await expect(page.locator('input[placeholder="Enter your invite code"]')).toBeVisible();
    
    // Click to switch back to sign in
    await page.click('text=Already have an account? Sign in');
    await expect(page.locator('text=Sign in to start collecting donations')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await testUtils.login('admin@donationapp.com', 'admin123');
    
    // Should redirect to dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, System Administrator')).toBeVisible();
  });

  test('should persist login state after page refresh', async ({ page }) => {
    await testUtils.login('admin@donationapp.com', 'admin123');
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, System Administrator')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[placeholder="Enter your email"]', 'invalid@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should validate invite code during registration', async ({ page }) => {
    // Switch to sign up mode
    await page.click('text=Don\'t have an account? Sign up');
    
    // Try to submit without invite code
    await page.fill('input[placeholder="Enter your full name"]', 'Test User');
    await page.fill('input[placeholder="Enter your email"]', 'test@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'password123');
    await page.click('button:has-text("Create Account")');
    
    // Should show error
    await expect(page.locator('text=Invite code is required')).toBeVisible();
  });

  test('should load invite details when valid invite code is entered', async ({ page }) => {
    // Switch to sign up mode
    await page.click('text=Don\'t have an account? Sign up');
    
    // Enter valid invite code
    await page.fill('input[placeholder="Enter your invite code"]', 'COLL1234');
    
    // Should show invite details
    await expect(page.locator('text=Invite for: Sample Collector (collector)')).toBeVisible();
    
    // Email and name should be pre-filled and disabled
    await expect(page.locator('input[placeholder="Enter your email"]')).toHaveValue('collector@example.com');
    await expect(page.locator('input[placeholder="Enter your full name"]')).toHaveValue('Sample Collector');
  });

  test('should show error for invalid invite code', async ({ page }) => {
    // Switch to sign up mode
    await page.click('text=Don\'t have an account? Sign up');
    
    // Enter invalid invite code
    await page.fill('input[placeholder="Enter your invite code"]', 'INVALID');
    
    // Should show error
    await expect(page.locator('text=Invalid invite code')).toBeVisible();
  });

  test('should successfully register with valid invite code', async ({ page }) => {
    await testUtils.registerWithInvite('COLL1234', 'collector@example.com', 'Sample Collector', 'password123');
    
    // Should redirect to dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, Sample Collector')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await testUtils.login('admin@donationapp.com', 'admin123');
    
    // Click logout button
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login form
    await expect(page.locator('text=Sign in to start collecting donations')).toBeVisible();
  });
});

