import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('Dashboard', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.clearLocalStorage();
    await testUtils.login('admin@donationapp.com', 'admin123');
  });

  test('should display dashboard elements', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, System Administrator')).toBeVisible();

    // Today's statistics cards
    await expect(page.locator('text=Today\'s Collection')).toBeVisible();
    await expect(page.locator('text=Today\'s Donations')).toBeVisible();
    await expect(page.locator('text=Today\'s Average')).toBeVisible();

    // Overall statistics cards
    await expect(page.locator('text=Total Collection')).toBeVisible();
    await expect(page.locator('text=Donations Count')).toBeVisible();
    await expect(page.locator('text=Average Donation')).toBeVisible();
  });

  test('should display tower cards', async ({ page }) => {
    // Check if tower cards are visible
    await expect(page.locator('text=Block A')).toBeVisible();
    await expect(page.locator('text=Block B')).toBeVisible();
    await expect(page.locator('text=Block C')).toBeVisible();
  });

  test('should display apartment buttons', async ({ page }) => {
    // Check if apartment buttons are visible
    await expect(page.locator('button:has-text("A1401")')).toBeVisible();
    await expect(page.locator('button:has-text("A1402")')).toBeVisible();
    await expect(page.locator('button:has-text("B1401")')).toBeVisible();
  });

  test('should show legend', async ({ page }) => {
    await expect(page.locator('text=Donated')).toBeVisible();
    await expect(page.locator('text=Follow-up')).toBeVisible();
    await expect(page.locator('text=Skip')).toBeVisible();
  });

  test('should have record new donation button', async ({ page }) => {
    await expect(page.locator('button:has-text("Record New Donation")')).toBeVisible();
  });

  test('should have logout button', async ({ page }) => {
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should handle theme switching', async ({ page }) => {
    // Test theme switching
    await testUtils.changeTheme('dark');
    await expect(page.locator('button:has-text("Dark")')).toHaveClass(/bg-white\/20/);
    
    await testUtils.changeTheme('ambient');
    await expect(page.locator('button:has-text("Ambient")')).toHaveClass(/bg-white\/20/);
    
    await testUtils.changeTheme('light');
    await expect(page.locator('button:has-text("Light")')).toHaveClass(/bg-white\/20/);
  });

  // test('should show recent donations section', async ({ page }) => {
  //   await expect(page.locator('text=Recent Donations')).toBeVisible();
  //   await expect(page.locator('text=Your latest donation records')).toBeVisible();
  // });

  // test('should show no donations message initially', async ({ page }) => {
  //   await expect(page.locator('text=No donations recorded yet. Click on apartment numbers above to get started.')).toBeVisible();
  // });
});

