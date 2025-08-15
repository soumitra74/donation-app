import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('End-to-End Workflows', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.clearLocalStorage();
    await page.goto('/');
  });

  test('complete donation collection workflow', async ({ page }) => {
    // 1. Login
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    await expect(page.locator('text=Donation Dashboard')).toBeVisible();
    
    // 2. Navigate to first apartment
    await testUtils.navigateToApartment(1, 14, 1);
    await expect(page.locator('text=A1401')).toBeVisible();
    
    // 3. Record first donation
    await testUtils.submitDonation({
      amount: '1000',
      donorName: 'First Donor',
      paymentMethod: 'cash',
      phoneNumber: '1111111111',
      headCount: '4'
    });
    
    // 4. Wait for transition and verify next apartment
    await testUtils.waitForTransitionComplete();
    await expect(page.locator('text=A1402')).toBeVisible();
    
    // 5. Mark second apartment for follow-up
    await testUtils.markForFollowUp('Need to visit later');
    
    // 6. Wait for transition and verify next apartment
    await testUtils.waitForTransitionComplete();
    await expect(page.locator('text=A1403')).toBeVisible();
    
    // 7. Record third donation with UPI
    await testUtils.submitDonation({
      amount: '750',
      donorName: 'Second Donor',
      paymentMethod: 'upi-self',
      phoneNumber: '2222222222',
      headCount: '2'
    });
    
    // 8. Return to dashboard
    await testUtils.waitForTransitionComplete();
    await page.click('button:has-text("Cancel")');
    
    // 9. Verify dashboard statistics
    await expect(page.locator('text=₹1,750')).toBeVisible(); // Total amount
    await expect(page.locator('text=2')).toBeVisible(); // Donation count
    
    // 10. Verify recent donations
    await expect(page.locator('text=First Donor')).toBeVisible();
    await expect(page.locator('text=Second Donor')).toBeVisible();
    await expect(page.locator('text=₹1000')).toBeVisible();
    await expect(page.locator('text=₹750')).toBeVisible();
    
    // 11. Verify apartment statuses
    const status1 = await testUtils.getApartmentStatus(1, 14, 1);
    const status2 = await testUtils.getApartmentStatus(1, 14, 2);
    const status3 = await testUtils.getApartmentStatus(1, 14, 3);
    
    expect(status1).toBe('donated');
    expect(status2).toBe('follow-up');
    expect(status3).toBe('donated');
  });

  test('theme persistence across sessions', async ({ page }) => {
    // 1. Login and change theme
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    await testUtils.changeTheme('dark');
    
    // 2. Verify theme is applied
    await expect(page.locator('button:has-text("Dark")')).toHaveClass(/bg-gray-700/);
    
    // 3. Refresh page
    await page.reload();
    
    // 4. Verify theme persists
    await expect(page.locator('text=Donation Dashboard')).toBeVisible();
    await expect(page.locator('button:has-text("Dark")')).toHaveClass(/bg-gray-700/);
    
    // 5. Change to ambient theme
    await testUtils.changeTheme('ambient');
    await expect(page.locator('button:has-text("Ambient")')).toHaveClass(/bg-white\/20/);
    
    // 6. Refresh again
    await page.reload();
    
    // 7. Verify ambient theme persists
    await expect(page.locator('button:has-text("Ambient")')).toHaveClass(/bg-white\/20/);
  });

  test('mobile responsive workflow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 1. Login
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    
    // 2. Verify mobile layout
    await expect(page.locator('text=Donation Dashboard').first()).not.toBeVisible(); // Desktop header hidden
    await expect(page.locator('text=Block A')).toBeVisible(); // Mobile header visible
    
    // 3. Navigate through towers using carousel
    await page.click('button[aria-label="Next tower"]');
    await expect(page.locator('text=Block B')).toBeVisible();
    
    await page.click('button[aria-label="Next tower"]');
    await expect(page.locator('text=Block C')).toBeVisible();
    
    await page.click('button[aria-label="Previous tower"]');
    await expect(page.locator('text=Block B')).toBeVisible();
    
    // 4. Navigate to apartment
    await testUtils.navigateToApartment(2, 14, 1);
    await expect(page.locator('text=B1401')).toBeVisible();
    
    // 5. Record donation
    await testUtils.submitDonation({
      amount: '500',
      donorName: 'Mobile Donor'
    });
    
    // 6. Wait for transition
    await testUtils.waitForTransitionComplete();
    await expect(page.locator('text=B1402')).toBeVisible();
    
    // 7. Return to dashboard
    await page.click('button:has-text("Cancel")');
    
    // 8. Verify statistics updated
    await expect(page.locator('text=₹500')).toBeVisible();
  });

  test('large donation with sponsorship workflow', async ({ page }) => {
    // 1. Login
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    
    // 2. Navigate to apartment
    await testUtils.navigateToApartment(1, 14, 1);
    
    // 3. Enter large amount to trigger sponsorship
    await page.fill('input[placeholder="₹ Donation Amount"]', '2000');
    
    // 4. Verify sponsorship options appear
    await expect(page.locator('select:has-text("Sponsorship")')).toBeVisible();
    await expect(page.locator('option:has-text("Flowers")')).toBeVisible();
    await expect(page.locator('option:has-text("Sweets")')).toBeVisible();
    await expect(page.locator('option:has-text("Decoration")')).toBeVisible();
    
    // 5. Fill complete form
    await page.fill('input[placeholder="Donor Name"]', 'Large Donor');
    await page.selectOption('select:has-text("Sponsorship")', 'Flowers');
    await page.fill('textarea[placeholder="Notes"]', 'Special occasion donation');
    await page.fill('input[placeholder="Phone Number"]', '3333333333');
    await page.fill('input[placeholder="Head Count"]', '6');
    
    // 6. Submit donation
    await page.click('button:has-text("Record Donation")');
    
    // 7. Wait for transition
    await testUtils.waitForTransitionComplete();
    await expect(page.locator('text=A1402')).toBeVisible();
    
    // 8. Return to dashboard
    await page.click('button:has-text("Cancel")');
    
    // 9. Verify large donation in statistics
    await expect(page.locator('text=₹2,000')).toBeVisible();
  });

  test('UPI other person workflow', async ({ page }) => {
    // 1. Login
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    
    // 2. Navigate to apartment
    await testUtils.navigateToApartment(1, 14, 1);
    
    // 3. Select UPI (other)
    await page.click('button:has-text("UPI (other)")');
    
    // 4. Verify UPI person selector appears
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('option:has-text("Surojeet")')).toBeVisible();
    await expect(page.locator('option:has-text("Pramit")')).toBeVisible();
    await expect(page.locator('option:has-text("Abhijit Banerjee")')).toBeVisible();
    
    // 5. Select UPI person
    await page.selectOption('select', 'Surojeet');
    
    // 6. Fill and submit form
    await testUtils.submitDonation({
      amount: '1500',
      donorName: 'UPI Donor',
      paymentMethod: 'upi-other'
    });
    
    // 7. Wait for transition
    await testUtils.waitForTransitionComplete();
    await expect(page.locator('text=A1402')).toBeVisible();
  });

  test('session persistence and logout workflow', async ({ page }) => {
    // 1. Login
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    
    // 2. Record a donation
    await testUtils.navigateToApartment(1, 14, 1);
    await testUtils.submitDonation({
      amount: '300',
      donorName: 'Session Donor'
    });
    
    // 3. Return to dashboard
    await testUtils.waitForTransitionComplete();
    await page.click('button:has-text("Cancel")');
    
    // 4. Verify data persists
    await expect(page.locator('text=₹300')).toBeVisible();
    
    // 5. Refresh page
    await page.reload();
    
    // 6. Verify still logged in with data
    await expect(page.locator('text=Donation Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome back, Soumitra Ghosh')).toBeVisible();
    await expect(page.locator('text=₹300')).toBeVisible();
    
    // 7. Logout
    await page.click('button:has-text("Logout")');
    
    // 8. Verify returned to login
    await expect(page.locator('text=Donation Collection')).toBeVisible();
    await expect(page.locator('text=Sign in to start collecting donations')).toBeVisible();
    
    // 9. Login again
    await testUtils.login('soumitraghosh@hotmail.com', '123');
    
    // 10. Verify data still exists
    await expect(page.locator('text=₹300')).toBeVisible();
    await expect(page.locator('text=Session Donor')).toBeVisible();
  });
});

