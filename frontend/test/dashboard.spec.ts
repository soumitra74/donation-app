import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('Dashboard', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.clearLocalStorage();
    await page.goto('/');
    await testUtils.login('soumitraghosh@hotmail.com', '123');
  });

  test('should display dashboard with correct elements', async ({ page }) => {
    // Check main dashboard elements
    await expect(page.locator('text=Donation Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, Soumitra Ghosh')).toBeVisible();
    
    // Check tower cards
    await expect(page.locator('text=Block A')).toBeVisible();
    await expect(page.locator('text=Block B')).toBeVisible();
    await expect(page.locator('text=Block C')).toBeVisible();
    
    // Check statistics cards
    await expect(page.locator('text=Total Collected')).toBeVisible();
    await expect(page.locator('text=Donations Count')).toBeVisible();
    await expect(page.locator('text=Average Donation')).toBeVisible();
    
    // Check action buttons
    await expect(page.locator('button:has-text("Record New Donation")')).toBeVisible();
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should display apartment buttons in tower cards', async ({ page }) => {
    // Check if apartment buttons are visible
    await expect(page.locator('button:has-text("A1401")')).toBeVisible();
    await expect(page.locator('button:has-text("A1402")')).toBeVisible();
    await expect(page.locator('button:has-text("A1403")')).toBeVisible();
    await expect(page.locator('button:has-text("A1404")')).toBeVisible();
    
    // Check if legend is displayed
    await expect(page.locator('text=Donated')).toBeVisible();
    await expect(page.locator('text=Visited')).toBeVisible();
    await expect(page.locator('text=Follow-up')).toBeVisible();
    await expect(page.locator('text=Skip')).toBeVisible();
  });

  test('should navigate to donation form when apartment is clicked', async ({ page }) => {
    // Click on an apartment
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Should show donation form
    await expect(page.locator('text=Record Donation')).toBeVisible();
    await expect(page.locator('text=A1401')).toBeVisible();
  });

  test('should display correct statistics for new user', async ({ page }) => {
    // For new user, statistics should be zero
    await expect(page.locator('text=₹0')).toBeVisible();
    await expect(page.locator('text=0')).toBeVisible(); // Donations count
    await expect(page.locator('text=₹0')).toBeVisible(); // Average donation
  });

  test('should update statistics after recording donations', async ({ page }) => {
    // Record a donation
    await testUtils.navigateToApartment(1, 14, 1);
    await testUtils.submitDonation({
      amount: '500',
      donorName: 'Test Donor',
      paymentMethod: 'cash'
    });
    
    // Wait for transition and return to dashboard
    await testUtils.waitForTransitionComplete();
    await page.click('button:has-text("Cancel")');
    
    // Statistics should be updated
    await expect(page.locator('text=₹500')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible(); // Donations count
  });

  test('should handle theme switching on dashboard', async ({ page }) => {
    // Test light theme (default)
    await expect(page.locator('button:has-text("Light")')).toHaveClass(/bg-blue-600/);
    
    // Switch to dark theme
    await testUtils.changeTheme('dark');
    await expect(page.locator('button:has-text("Dark")')).toHaveClass(/bg-gray-700/);
    
    // Switch to ambient theme
    await testUtils.changeTheme('ambient');
    await expect(page.locator('button:has-text("Ambient")')).toHaveClass(/bg-white\/20/);
  });

  test('should display recent donations section', async ({ page }) => {
    // Check recent donations section
    await expect(page.locator('text=Recent Donations')).toBeVisible();
    await expect(page.locator('text=Your latest donation records')).toBeVisible();
    
    // Should show empty state for new user
    await expect(page.locator('text=No donations recorded yet')).toBeVisible();
  });

  test('should show recent donations after recording', async ({ page }) => {
    // Record a donation
    await testUtils.navigateToApartment(1, 14, 1);
    await testUtils.submitDonation({
      amount: '1000',
      donorName: 'Recent Donor',
      paymentMethod: 'upi-self',
      phoneNumber: '1234567890'
    });
    
    // Wait for transition and return to dashboard
    await testUtils.waitForTransitionComplete();
    await page.click('button:has-text("Cancel")');
    
    // Should show the donation in recent donations
    await expect(page.locator('text=Recent Donor')).toBeVisible();
    await expect(page.locator('text=₹1000')).toBeVisible();
    await expect(page.locator('text=A1401')).toBeVisible();
  });

  test('should handle mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Header should be hidden on mobile
    await expect(page.locator('text=Donation Dashboard').first()).not.toBeVisible();
    
    // Mobile header should be visible
    await expect(page.locator('text=Block A')).toBeVisible();
    
    // Carousel navigation should be visible
    await expect(page.locator('button[aria-label="Previous tower"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Next tower"]')).toBeVisible();
  });

  test('should navigate between towers in mobile carousel', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Initially should show Block A
    await expect(page.locator('text=Block A')).toBeVisible();
    
    // Navigate to next tower
    await page.click('button[aria-label="Next tower"]');
    await expect(page.locator('text=Block B')).toBeVisible();
    
    // Navigate to previous tower
    await page.click('button[aria-label="Previous tower"]');
    await expect(page.locator('text=Block A')).toBeVisible();
  });
});

