/**
 * Donations service for the donation app
 * Handles API calls to the backend donations endpoints
 */

export interface Donation {
  id: number
  donor_name: string
  amount: number  // Integer amount in rupees
  tower: number
  floor: number
  unit: number
  phone_number?: string
  head_count?: number
  volunteer_id?: string
  volunteer_name?: string
  created_at: string
  payment_method?: string
  upi_other_person?: string
  sponsorship?: string
  sponsorship_id?: number
  notes?: string
  status: string
  user_id?: number
}

export interface DonationStats {
  total_donations: number
  total_amount: number
  average_donation: number
  follow_ups: number
  skipped: number
}

export interface CreateDonationData {
  donor_name: string
  amount: number  // Integer amount in rupees
  tower: number
  floor: number
  unit: number
  phone_number?: string
  head_count?: number
  payment_method?: string
  upi_other_person?: string
  sponsorship?: string
  sponsorship_id?: number
  notes?: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/api/v1'

class DonationsService {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('donation-app-token')
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available
    if (this.token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${this.token}`,
      }
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Get all donations
  async getDonations(): Promise<Donation[]> {
    return await this.makeRequest('/donations')
  }

  // Get a specific donation
  async getDonation(donationId: number): Promise<Donation> {
    return await this.makeRequest(`/donations/${donationId}`)
  }

  // Create a new donation
  async createDonation(donationData: CreateDonationData): Promise<Donation> {
    return await this.makeRequest('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData),
    })
  }

  // Update an existing donation
  async updateDonation(donationId: number, donationData: CreateDonationData): Promise<Donation> {
    const endpoint = `/donations/${donationId}`
    return await this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(donationData),
    })
  }

  // Delete a donation (admin only)
  async deleteDonation(donationId: number): Promise<{ message: string }> {
    return await this.makeRequest(`/donations/${donationId}`, {
      method: 'DELETE',
    })
  }

  // Get donation for a specific apartment
  async getApartmentDonation(tower: number, floor: number, unit: number): Promise<Donation | null> {
    try {
      return await this.makeRequest(`/donations/apartment/${tower}/${floor}/${unit}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  // Create donation for a specific apartment
  async createApartmentDonation(
    tower: number, 
    floor: number, 
    unit: number, 
    donationData: CreateDonationData
  ): Promise<Donation> {
    return await this.makeRequest(`/donations/apartment/${tower}/${floor}/${unit}`, {
      method: 'POST',
      body: JSON.stringify(donationData),
    })
  }

  // Mark apartment for follow-up
  async markApartmentFollowUp(
    tower: number, 
    floor: number, 
    unit: number, 
    notes?: string
  ): Promise<Donation> {
    return await this.makeRequest(`/donations/apartment/${tower}/${floor}/${unit}/follow-up`, {
      method: 'POST',
      body: JSON.stringify({
        donor_name: 'Follow-up Required',
        notes: notes || 'Marked for follow-up',
      }),
    })
  }

  // Mark apartment as skipped
  async markApartmentSkipped(
    tower: number, 
    floor: number, 
    unit: number, 
    notes?: string
  ): Promise<Donation> {
    return await this.makeRequest(`/donations/apartment/${tower}/${floor}/${unit}/skip`, {
      method: 'POST',
      body: JSON.stringify({
        donor_name: 'Skipped',
        notes: notes || 'Apartment skipped',
      }),
    })
  }

  // Get donation statistics
  async getStats(): Promise<DonationStats> {
    return await this.makeRequest('/stats')
  }

  // Get donations by user (current user's donations)
  async getMyDonations(userId: number): Promise<Donation[]> {
    return await this.makeRequest(`/donations?user_id=${userId}`)
  }

  // Export donations to Excel
  async exportToExcel(): Promise<void> {
    const url = `${API_BASE_URL}/export/excel`
    
    const config: RequestInit = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Get the blob from the response
      const blob = await response.blob()
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'donation_report.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Excel export failed:', error)
      throw error
    }
  }

  // Update token (called when user logs in)
  updateToken(token: string): void {
    this.token = token
  }

  // Clear token (called when user logs out)
  clearToken(): void {
    this.token = null
  }
}

export const donationsService = new DonationsService()
