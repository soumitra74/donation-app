/**
 * Sponsorships service for the donation app
 * Handles API calls to the backend sponsorships endpoints
 */

export interface Sponsorship {
  id: number
  name: string
  amount: string
  max_count: number
  booked: number
  is_closed: boolean
  created_at: string
  updated_at: string
}

export interface CreateSponsorshipData {
  name: string
  amount: number
  max_count: number
  is_booked?: boolean
}

export interface UpdateSponsorshipData {
  name?: string
  amount?: number
  max_count?: number
  is_booked?: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

class SponsorshipsService {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('donation-app-token')
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}, requireAuth: boolean = true): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available and required
    if (requireAuth && this.token) {
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

  // Get all sponsorships
  async getSponsorships(): Promise<Sponsorship[]> {
    return await this.makeRequest('/sponsorships', {}, false)
  }

  // Get a specific sponsorship
  async getSponsorship(sponsorshipId: number): Promise<Sponsorship> {
    return await this.makeRequest(`/sponsorships/${sponsorshipId}`)
  }

  // Create a new sponsorship
  async createSponsorship(data: CreateSponsorshipData): Promise<Sponsorship> {
    return await this.makeRequest('/sponsorships', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Update a sponsorship
  async updateSponsorship(sponsorshipId: number, data: UpdateSponsorshipData): Promise<Sponsorship> {
    return await this.makeRequest(`/sponsorships/${sponsorshipId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Delete a sponsorship
  async deleteSponsorship(sponsorshipId: number): Promise<void> {
    return await this.makeRequest(`/sponsorships/${sponsorshipId}`, {
      method: 'DELETE',
    })
  }

  // Book a sponsorship
  async bookSponsorship(sponsorshipId: number): Promise<Sponsorship> {
    return await this.makeRequest(`/sponsorships/${sponsorshipId}/book`, {
      method: 'POST',
    })
  }

  // Unbook a sponsorship
  async unbookSponsorship(sponsorshipId: number): Promise<Sponsorship> {
    return await this.makeRequest(`/sponsorships/${sponsorshipId}/unbook`, {
      method: 'POST',
    })
  }

  // Get available sponsorships (not fully booked)
  async getAvailableSponsorships(): Promise<Sponsorship[]> {
    const sponsorships = await this.getSponsorships()
    return sponsorships.filter(sponsorship => !sponsorship.is_closed)
  }
}

// Export a singleton instance
export const sponsorshipsService = new SponsorshipsService()
