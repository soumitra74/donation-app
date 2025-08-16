import { Page, expect } from '@playwright/test';

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Clear all localStorage data
   */
  async clearLocalStorage() {
    try {
      await this.page.evaluate(() => {
        try {
          localStorage.clear();
        } catch (e) {
          console.warn('localStorage.clear() failed:', e);
          // Fallback: try to clear specific keys
          try {
            localStorage.removeItem("donation-app-user");
            localStorage.removeItem("donation-app-theme");
            localStorage.removeItem("donation-app-donations");
            localStorage.removeItem("donation-app-followups");
            localStorage.removeItem("donation-app-volunteers");
            localStorage.removeItem("donation-app-skipped");
          } catch (e2) {
            console.warn('Could not remove specific localStorage items:', e2);
          }
        }
      });
    } catch (error) {
      console.warn('Could not execute localStorage clear:', error);
    }
  }

  /**
   * Login with test credentials
   */
  async login(email: string = 'soumitraghosh@hotmail.com', password: string = '123') {
    // Fill email and password fields
    await this.page.fill('input[placeholder="Enter your email"]', email);
    await this.page.fill('input[placeholder="Enter your password"]', password);
    await this.page.click('button:has-text("Sign In")');
    
    // Wait for login to complete
    await this.page.waitForSelector('text=Donation Dashboard', { timeout: 5000 });
  }

  /**
   * Navigate to donation form for a specific apartment
   */
  async navigateToApartment(tower: number, floor: number, unit: number) {
    const towerLetter = String.fromCharCode(64 + tower); // A, B, C, etc.
    const apartmentNumber = `${towerLetter}${floor.toString()}${unit.toString().padStart(2, "0")}`;
    
    // Click on the apartment button
    await this.page.click(`button:has-text("${apartmentNumber}")`);
    
    // Wait for form to load
    await this.page.waitForSelector('text=Record Donation', { timeout: 5000 });
  }

  /**
   * Fill and submit a donation form
   */
  async submitDonation(donationData: {
    amount: string;
    donorName: string;
    paymentMethod?: 'cash' | 'upi-self' | 'upi-other';
    phoneNumber?: string;
    headCount?: string;
    notes?: string;
  }) {
    // Fill amount
    await this.page.fill('input[placeholder="₹ Donation Amount"]', donationData.amount);
    
    // Select payment method if specified
    if (donationData.paymentMethod) {
      await this.page.click(`button:has-text("${donationData.paymentMethod === 'upi-self' ? 'UPI (self)' : donationData.paymentMethod === 'upi-other' ? 'UPI (other)' : 'Cash'}")`);
    }
    
    // Fill donor name
    await this.page.fill('input[placeholder="Donor Name"]', donationData.donorName);
    
    // Fill optional fields
    if (donationData.phoneNumber) {
      await this.page.fill('input[placeholder="Phone Number"]', donationData.phoneNumber);
    }
    
    if (donationData.headCount) {
      await this.page.fill('input[placeholder="Head Count"]', donationData.headCount);
    }
    
    if (donationData.notes) {
      await this.page.fill('textarea[placeholder="Notes"]', donationData.notes);
    }
    
    // Submit the form
    await this.page.click('button:has-text("Record Donation")');
  }

  /**
   * Mark apartment for follow-up
   */
  async markForFollowUp(notes?: string) {
    if (notes) {
      await this.page.fill('textarea[placeholder="Notes"]', notes);
    }
    await this.page.click('button:has-text("Follow up")');
  }

  /**
   * Skip apartment
   */
  async skipApartment(notes?: string) {
    if (notes) {
      await this.page.fill('textarea[placeholder="Notes"]', notes);
    }
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
    try {
      return await this.page.evaluate(({ tower, floor, unit }) => {
        try {
          // Check donations
          const donations = JSON.parse(localStorage.getItem("donation-app-donations") || "[]");
          const donation = donations.find((d: any) => d.tower === tower && d.floor === floor && d.unit === unit);
          if (donation) return "donated";

          // Check follow-ups
          const followUps = JSON.parse(localStorage.getItem("donation-app-followups") || "[]");
          const followUp = followUps.find((f: any) => f.tower === tower && f.floor === floor && f.unit === unit);
          if (followUp) return "follow-up";

          // Check skipped
          const skipped = JSON.parse(localStorage.getItem("donation-app-skipped") || "[]");
          const skip = skipped.find((s: any) => s.tower === tower && s.floor === floor && s.unit === unit);
          if (skip) return "skipped";

          return "not-visited";
        } catch (e) {
          console.warn('Error accessing localStorage:', e);
          return "not-visited";
        }
      }, { tower, floor, unit });
    } catch (error) {
      console.warn('Could not get apartment status from localStorage:', error);
      return "not-visited";
    }
  }

  /**
   * Wait for transition overlay to disappear
   */
  async waitForTransitionComplete() {
    try {
      await this.page.waitForSelector('.absolute.inset-0.bg-black\\/50', { state: 'hidden', timeout: 10000 });
    } catch (error) {
      console.warn('Transition overlay not found or already hidden:', error);
    }
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Take a screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }
}

