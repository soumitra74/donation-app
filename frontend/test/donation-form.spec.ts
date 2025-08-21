import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('Donation Form', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.clearLocalStorage();
    await testUtils.login('admin@donationapp.com', 'admin123');
    await testUtils.navigateToApartment(1, 14, 1);
  });

  test('should display donation form elements', async ({ page }) => {
    await expect(page.locator('text=Donation Form')).toBeVisible();
    await expect(page.locator('text=A1401')).toBeVisible();
    await expect(page.locator('input[placeholder="Donor name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Amount"]')).toBeVisible();
    await expect(page.locator('button:has-text("Submit Donation")')).toBeVisible();
  });

  test('should fill and submit donation form', async ({ page }) => {
    await testUtils.submitDonation({
      donorName: 'Test Donor',
      amount: '500',
      phoneNumber: '1234567890',
      headCount: '4',
      paymentMethod: 'cash',
      notes: 'Test donation'
    });

    // Should show success message and transition
    await expect(page.locator('text=Donation recorded! Moving to next apartment...')).toBeVisible();
  });

  test('should mark apartment for follow-up', async ({ page }) => {
    await testUtils.markForFollowUp();

    // Should show success message and transition
    await expect(page.locator('text=Follow-up recorded! Moving to next apartment...')).toBeVisible();
  });

  test('should skip apartment', async ({ page }) => {
    await testUtils.skipApartment();

    // Should show success message and transition
    await expect(page.locator('text=Apartment skipped! Moving to next apartment...')).toBeVisible();
  });

  test('should navigate to next apartment after submission', async ({ page }) => {
    await testUtils.submitDonation({
      donorName: 'Test Donor',
      amount: '500'
    });

    // Wait for transition
    await testUtils.waitForTransitionComplete();

    // Should show next apartment (A1402)
    await expect(page.locator('text=A1402')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without required fields
    await page.click('button:has-text("Submit Donation")');

    // Form should still be visible (no submission)
    await expect(page.locator('text=Donation Form')).toBeVisible();
  });

  test('should handle form cancellation', async ({ page }) => {
    await page.click('button:has-text("Cancel")');

    // Should return to dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show apartment navigation info', async ({ page }) => {
    await expect(page.locator('text=Current Apartment: A1401')).toBeVisible();
    await expect(page.locator('text=Next: A1402')).toBeVisible();
  });
});

