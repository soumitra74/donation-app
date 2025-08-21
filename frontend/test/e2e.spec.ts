import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('End-to-End Workflows', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.clearLocalStorage();
  });

  test('complete donation collection workflow', async ({ page }) => {
    // 1. Login
    await testUtils.login('admin@donationapp.com', 'admin123');
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // 2. Navigate to donation form
    await testUtils.navigateToApartment(1, 14, 1);
    await expect(page.locator('text=Donation Form')).toBeVisible();

    // 3. Record a donation
    await testUtils.submitDonation({
      donorName: 'John Doe',
      amount: '500',
      phoneNumber: '1234567890',
      headCount: '4',
      paymentMethod: 'cash',
      notes: 'First donation'
    });

    // 4. Wait for transition and verify next apartment
    await testUtils.waitForTransitionComplete();
    await expect(page.locator('text=A1402')).toBeVisible();

    // 5. Record another donation
    await testUtils.submitDonation({
      donorName: 'Jane Smith',
      amount: '750',
      phoneNumber: '0987654321',
      headCount: '3',
      paymentMethod: 'upi-self',
      notes: 'Second donation'
    });

    // 6. Return to dashboard
    await testUtils.waitForTransitionComplete();
    await page.click('button:has-text("Cancel")');

    // 7. Verify dashboard shows updated statistics
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=₹1250')).toBeVisible(); // Total amount
    await expect(page.locator('text=2')).toBeVisible(); // Donation count
  });

  test('follow-up workflow', async ({ page }) => {
    // 1. Login
    await testUtils.login('admin@donationapp.com', 'admin123');

    // 2. Navigate to donation form
    await testUtils.navigateToApartment(1, 14, 1);

    // 3. Mark for follow-up
    await testUtils.markForFollowUp();

    // 4. Wait for transition
    await testUtils.waitForTransitionComplete();

    // 5. Return to dashboard
    await page.click('button:has-text("Cancel")');

    // 6. Verify follow-up is recorded
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('skip apartment workflow', async ({ page }) => {
    // 1. Login
    await testUtils.login('admin@donationapp.com', 'admin123');

    // 2. Navigate to donation form
    await testUtils.navigateToApartment(1, 14, 1);

    // 3. Skip apartment
    await testUtils.skipApartment();

    // 4. Wait for transition
    await testUtils.waitForTransitionComplete();

    // 5. Return to dashboard
    await page.click('button:has-text("Cancel")');

    // 6. Verify skip is recorded
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('registration workflow with invite code', async ({ page }) => {
    // 1. Go to registration
    await page.goto('/');
    await page.click('text=Don\'t have an account? Sign up');

    // 2. Enter invite code
    await page.fill('input[placeholder="Enter your invite code"]', 'COLL1234');

    // 3. Wait for invite details to load
    await expect(page.locator('text=Invite for: Sample Collector (collector)')).toBeVisible();

    // 4. Complete registration
    await page.fill('input[placeholder="Enter your password"]', 'password123');
    await page.click('button:has-text("Create Account")');

    // 5. Verify successful registration
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, Sample Collector')).toBeVisible();
  });

  test('theme switching workflow', async ({ page }) => {
    // 1. Login
    await testUtils.login('admin@donationapp.com', 'admin123');

    // 2. Switch to dark theme
    await testUtils.changeTheme('dark');
    await expect(page.locator('button:has-text("Dark")')).toHaveClass(/bg-white\/20/);

    // 3. Switch to ambient theme
    await testUtils.changeTheme('ambient');
    await expect(page.locator('button:has-text("Ambient")')).toHaveClass(/bg-white\/20/);

    // 4. Switch back to light theme
    await testUtils.changeTheme('light');
    await expect(page.locator('button:has-text("Light")')).toHaveClass(/bg-white\/20/);

    // 5. Refresh page and verify theme persists
    await page.reload();
    await expect(page.locator('button:has-text("Light")')).toHaveClass(/bg-white\/20/);
  });

  test('logout workflow', async ({ page }) => {
    // 1. Login
    await testUtils.login('admin@donationapp.com', 'admin123');
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // 2. Logout
    await page.click('button:has-text("Logout")');

    // 3. Verify return to login form
    await expect(page.locator('text=Sign in to start collecting donations')).toBeVisible();

    // 4. Verify can't access dashboard without login
    await page.goto('/');
    await expect(page.locator('text=Sign in to start collecting donations')).toBeVisible();
  });

  test('mobile responsive workflow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Login
    await testUtils.login('admin@donationapp.com', 'admin123');

    // 2. Verify mobile layout
    await expect(page.locator('text=Block A')).toBeVisible();
    await expect(page.locator('button[aria-label="Previous tower"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Next tower"]')).toBeVisible();

    // 3. Navigate between towers
    await page.click('button[aria-label="Next tower"]');
    await expect(page.locator('text=Block B')).toBeVisible();

    await page.click('button[aria-label="Previous tower"]');
    await expect(page.locator('text=Block A')).toBeVisible();

    // 4. Navigate to donation form
    await testUtils.navigateToApartment(1, 14, 1);
    await expect(page.locator('text=Donation Form')).toBeVisible();
  });

  test('error handling workflow', async ({ page }) => {
    // 1. Try to login with invalid credentials
    await page.goto('/');
    await page.fill('input[placeholder="Enter your email"]', 'invalid@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');

    // 2. Verify error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();

    // 3. Try to register with invalid invite code
    await page.click('text=Don\'t have an account? Sign up');
    await page.fill('input[placeholder="Enter your invite code"]', 'INVALID');
    await expect(page.locator('text=Invalid invite code')).toBeVisible();

    // 4. Try to register without invite code
    await page.fill('input[placeholder="Enter your invite code"]', '');
    await page.fill('input[placeholder="Enter your full name"]', 'Test User');
    await page.fill('input[placeholder="Enter your email"]', 'test@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'password123');
    await page.click('button:has-text("Create Account")');
    await expect(page.locator('text=Invite code is required')).toBeVisible();
  });
});

