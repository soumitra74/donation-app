import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('Donation Form', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.clearLocalStorage();
    await page.goto('/');
    await testUtils.login('soumitraghosh@hotmail.com', '123');
  });

  test('should display donation form with correct elements', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Check form elements
    await expect(page.locator('text=A1401')).toBeVisible();
    await expect(page.locator('text=Block 1 • Floor 14 • Unit 1')).toBeVisible();
    await expect(page.locator('input[placeholder="₹ Donation Amount"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Donor Name"]')).toBeVisible();
    await expect(page.locator('button:has-text("Record Donation")')).toBeVisible();
    await expect(page.locator('button:has-text("Follow up")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should display payment method buttons', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Check payment method buttons
    await expect(page.locator('button:has-text("Cash")')).toBeVisible();
    await expect(page.locator('button:has-text("UPI (self)")')).toBeVisible();
    await expect(page.locator('button:has-text("UPI (other)")')).toBeVisible();
  });

  test('should select payment methods correctly', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Test Cash selection
    await page.click('button:has-text("Cash")');
    await expect(page.locator('button:has-text("Cash")')).toHaveClass(/bg-blue-600/);
    
    // Test UPI (self) selection
    await page.click('button:has-text("UPI (self)")');
    await expect(page.locator('button:has-text("UPI (self)")')).toHaveClass(/bg-blue-600/);
    
    // Test UPI (other) selection
    await page.click('button:has-text("UPI (other)")');
    await expect(page.locator('button:has-text("UPI (other)")')).toHaveClass(/bg-blue-600/);
  });

  test('should show UPI person selector when UPI (other) is selected', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Select UPI (other)
    await page.click('button:has-text("UPI (other)")');
    
    // Should show UPI person selector
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('option:has-text("Surojeet")')).toBeVisible();
    await expect(page.locator('option:has-text("Pramit")')).toBeVisible();
    await expect(page.locator('option:has-text("Abhijit Banerjee")')).toBeVisible();
  });

  test('should show sponsorship and notes for donations over 500', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Enter amount over 500
    await page.fill('input[placeholder="₹ Donation Amount"]', '1000');
    
    // Should show sponsorship selector
    await expect(page.locator('select:has-text("Sponsorship")')).toBeVisible();
    await expect(page.locator('option:has-text("Flowers")')).toBeVisible();
    await expect(page.locator('option:has-text("Sweets")')).toBeVisible();
    await expect(page.locator('option:has-text("Decoration")')).toBeVisible();
    
    // Should show notes textarea
    await expect(page.locator('textarea[placeholder="Notes"]')).toBeVisible();
  });

  test('should not show sponsorship for donations under 500', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Enter amount under 500
    await page.fill('input[placeholder="₹ Donation Amount"]', '300');
    
    // Should not show sponsorship selector
    await expect(page.locator('select:has-text("Sponsorship")')).not.toBeVisible();
    await expect(page.locator('textarea[placeholder="Notes"]')).not.toBeVisible();
  });

  test('should successfully record a donation and navigate to next apartment', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Fill donation form
    await testUtils.submitDonation({
      amount: '750',
      donorName: 'John Smith',
      paymentMethod: 'cash',
      phoneNumber: '9876543210',
      headCount: '3'
    });
    
    // Should show transition message
    await expect(page.locator('text=Donation recorded! Moving to next apartment...')).toBeVisible();
    
    // Wait for transition to complete
    await testUtils.waitForTransitionComplete();
    
    // Should navigate to next apartment (A1402)
    await expect(page.locator('text=A1402')).toBeVisible();
    
    // Form should be cleared
    await expect(page.locator('input[placeholder="₹ Donation Amount"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="Donor Name"]')).toHaveValue('');
  });

  test('should mark apartment for follow-up and navigate to next apartment', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Fill some basic info
    await page.fill('input[placeholder="Donor Name"]', 'Follow Up Test');
    await page.fill('textarea[placeholder="Notes"]', 'Need to follow up later');
    
    // Click follow up
    await testUtils.markForFollowUp('Need to follow up later');
    
    // Should show transition message
    await expect(page.locator('text=Follow up saved! Moving to next apartment...')).toBeVisible();
    
    // Wait for transition to complete
    await testUtils.waitForTransitionComplete();
    
    // Should navigate to next apartment
    await expect(page.locator('text=A1402')).toBeVisible();
  });

  test('should skip apartment and navigate to next apartment', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Fill some basic info
    await page.fill('input[placeholder="Donor Name"]', 'Skip Test');
    await page.fill('textarea[placeholder="Notes"]', 'Apartment not available');
    
    // Click skip
    await testUtils.skipApartment('Apartment not available');
    
    // Should show transition message
    await expect(page.locator('text=Apartment skipped! Moving to next apartment...')).toBeVisible();
    
    // Wait for transition to complete
    await testUtils.waitForTransitionComplete();
    
    // Should navigate to next apartment
    await expect(page.locator('text=A1402')).toBeVisible();
  });

  test('should navigate between apartments using arrow buttons', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Should start at A1401
    await expect(page.locator('text=A1401')).toBeVisible();
    
    // Navigate to next apartment
    await page.click('button[aria-label="Next apartment"]');
    await expect(page.locator('text=A1402')).toBeVisible();
    
    // Navigate to previous apartment
    await page.click('button[aria-label="Previous apartment"]');
    await expect(page.locator('text=A1401')).toBeVisible();
  });

  test('should handle apartment navigation at boundaries', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Navigate to last apartment in floor
    await page.click('button[aria-label="Next apartment"]');
    await page.click('button[aria-label="Next apartment"]');
    await page.click('button[aria-label="Next apartment"]');
    await expect(page.locator('text=A1404')).toBeVisible();
    
    // Navigate to next should go to next floor
    await page.click('button[aria-label="Next apartment"]');
    await expect(page.locator('text=A1301')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Try to submit without required fields
    await page.click('button:has-text("Record Donation")');
    
    // Form should still be visible (no submission)
    await expect(page.locator('text=Record Donation')).toBeVisible();
  });

  test('should disable form during transition', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Fill and submit form
    await testUtils.submitDonation({
      amount: '500',
      donorName: 'Test User'
    });
    
    // During transition, form should be disabled
    await expect(page.locator('input[placeholder="₹ Donation Amount"]')).toBeDisabled();
    await expect(page.locator('input[placeholder="Donor Name"]')).toBeDisabled();
    await expect(page.locator('button:has-text("Record Donation")')).toBeDisabled();
    await expect(page.locator('button:has-text("Follow up")')).toBeDisabled();
  });

  test('should cancel and return to dashboard', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    
    // Should return to dashboard
    await expect(page.locator('text=Donation Dashboard')).toBeVisible();
  });

  test('should handle form with preselected apartment', async ({ page }) => {
    // Navigate to a specific apartment
    await testUtils.navigateToApartment(2, 10, 3);
    
    // Should show correct apartment
    await expect(page.locator('text=B1003')).toBeVisible();
    await expect(page.locator('text=Block 2 • Floor 10 • Unit 3')).toBeVisible();
  });

  test('should update apartment status after donation', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Record donation
    await testUtils.submitDonation({
      amount: '500',
      donorName: 'Status Test'
    });
    
    // Wait for transition and return to dashboard
    await testUtils.waitForTransitionComplete();
    await page.click('button:has-text("Cancel")');
    
    // Check apartment status in localStorage
    const status = await testUtils.getApartmentStatus(1, 14, 1);
    expect(status).toBe('donated');
  });

  test('should update apartment status after follow-up', async ({ page }) => {
    await testUtils.navigateToApartment(1, 14, 1);
    
    // Mark for follow-up
    await testUtils.markForFollowUp('Test follow-up');
    
    // Wait for transition and return to dashboard
    await testUtils.waitForTransitionComplete();
    await page.click('button:has-text("Cancel")');
    
    // Check apartment status in localStorage
    const status = await testUtils.getApartmentStatus(1, 14, 1);
    expect(status).toBe('follow-up');
  });
});

