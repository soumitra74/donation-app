import { Page, expect } from '@playwright/test';

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Clear all localStorage data
   */
  async clearLocalStorage() {
    try {
      await this.page.evaluate(() => {
        localStorage.clear();
      });
    } catch (error) {
      console.warn('Could not execute localStorage clear:', error);
    }
  }

  /**
   * Login with test credentials (using default admin user)
   */
  async login(email: string = 'admin@donationapp.com', password: string = 'admin123') {
    // Fill email and password fields
    await this.page.fill('input[placeholder="Enter your email"]', email);
    await this.page.fill('input[placeholder="Enter your password"]', password);
    await this.page.click('button:has-text("Sign In")');
    
    // Wait for login to complete
    await this.page.waitForSelector('text=Dashboard', { timeout: 5000 });
  }

  /**
   * Register with invite code
   */
  async registerWithInvite(inviteCode: string, email: string, name: string, password: string) {
    // Switch to sign up mode
    await this.page.click('text=Don\'t have an account? Sign up');
    
    // Fill invite code
    await this.page.fill('input[placeholder="Enter your invite code"]', inviteCode);
    
    // Wait for invite details to load
    await this.page.waitForSelector('text=Invite for:', { timeout: 5000 });
    
    // Fill other fields
    await this.page.fill('input[placeholder="Enter your password"]', password);
    
    // Submit registration
    await this.page.click('button:has-text("Create Account")');
    
    // Wait for registration to complete
    await this.page.waitForSelector('text=Dashboard', { timeout: 5000 });
  }

  /**
   * Navigate to donation form for a specific apartment
   */
  async navigateToApartment(tower: number, floor: number, unit: number) {
    const towerLetter = String.fromCharCode(64 + tower);
    const apartmentNumber = `${towerLetter}${floor.toString()}${unit.toString().padStart(2, "0")}`;
    
    await this.page.click(`button:has-text("${apartmentNumber}")`);
    await this.page.waitForSelector('text=Donation Form', { timeout: 5000 });
  }

  /**
   * Submit a donation
   */
  async submitDonation(donationData: {
    donorName: string;
    amount: string;
    phoneNumber?: string;
    headCount?: string;
    paymentMethod?: string;
    notes?: string;
  }) {
    await this.page.fill('input[placeholder="Donor name"]', donationData.donorName);
    await this.page.fill('input[placeholder="Amount"]', donationData.amount);
    
    if (donationData.phoneNumber) {
      await this.page.fill('input[placeholder="Phone number"]', donationData.phoneNumber);
    }
    
    if (donationData.headCount) {
      await this.page.fill('input[placeholder="Head count"]', donationData.headCount);
    }
    
    if (donationData.paymentMethod) {
      await this.page.selectOption('select', donationData.paymentMethod);
    }
    
    if (donationData.notes) {
      await this.page.fill('textarea[placeholder="Notes"]', donationData.notes);
    }
    
    await this.page.click('button:has-text("Submit Donation")');
  }

  /**
   * Mark apartment for follow-up
   */
  async markForFollowUp() {
    await this.page.click('button:has-text("Follow Up")');
  }

  /**
   * Skip apartment
   */
  async skipApartment() {
    await this.page.click('button:has-text("Skip")');
  }

  /**
   * Change theme
   */
  async changeTheme(theme: 'light' | 'dark' | 'ambient') {
    await this.page.click(`button:has-text("${theme.charAt(0).toUpperCase() + theme.slice(1)}")`);
  }

  /**
   * Get apartment status from localStorage
   */
  async getApartmentStatus(tower: number, floor: number, unit: number): Promise<string> {
    return await this.page.evaluate(({ tower, floor, unit }) => {
      const donations = JSON.parse(localStorage.getItem("donation-app-donations") || "[]");
      const donation = donations.find((d: any) => d.tower === tower && d.floor === floor && d.unit === unit);
      if (donation) return "donated";

      const followUps = JSON.parse(localStorage.getItem("donation-app-followups") || "[]");
      const followUp = followUps.find((f: any) => f.tower === tower && f.floor === floor && f.unit === unit);
      if (followUp) return "follow-up";

      const skippedApartments = JSON.parse(localStorage.getItem("donation-app-skipped") || "[]");
      const skipped = skippedApartments.find((s: any) => s.tower === tower && s.floor === floor && s.unit === unit);
      if (skipped) return "skipped";
      
      return "not-visited";
    }, { tower, floor, unit });
  }

  /**
   * Wait for transition to complete
   */
  async waitForTransitionComplete() {
    await this.page.waitForTimeout(2000); // Wait for transition animation
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }
}

