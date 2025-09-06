/**
 * Sponsorships service for the donation app
 * Handles API calls to the backend sponsorships endpoints
 */

export interface Sponsorship {
  id: number
  name: string
  amount: number  // Integer amount in rupees
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/api/v1'

class SponsorshipsService {
  private token: string | null = null
  private sponsorshipsCache: Sponsorship[] | null = null
  private subscribers: Array<(sponsorships: Sponsorship[]) => void> = []

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

  // Get all sponsorships
  async getSponsorships(): Promise<Sponsorship[]> {
    const data = await this.makeRequest('/sponsorships')
    this.sponsorshipsCache = data
    this.notifySubscribers()
    return data
  }

  // Get a specific sponsorship
  async getSponsorship(sponsorshipId: number): Promise<Sponsorship> {
    return await this.makeRequest(`/sponsorships/${sponsorshipId}`)
  }

  // Create a new sponsorship
  async createSponsorship(data: CreateSponsorshipData): Promise<Sponsorship> {
    const created = await this.makeRequest('/sponsorships', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    await this.preloadSponsorships(true)
    return created
  }

  // Update a sponsorship
  async updateSponsorship(sponsorshipId: number, data: UpdateSponsorshipData): Promise<Sponsorship> {
    const updated = await this.makeRequest(`/sponsorships/${sponsorshipId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    await this.preloadSponsorships(true)
    return updated
  }

  // Delete a sponsorship
  async deleteSponsorship(sponsorshipId: number): Promise<void> {
    const res = await this.makeRequest(`/sponsorships/${sponsorshipId}`, {
      method: 'DELETE',
    })
    await this.preloadSponsorships(true)
    return res
  }

  // Book a sponsorship
  async bookSponsorship(sponsorshipId: number): Promise<Sponsorship> {
    const booked = await this.makeRequest(`/sponsorships/${sponsorshipId}/book`, {
      method: 'POST',
    })
    await this.preloadSponsorships(true)
    return booked
  }

  // Unbook a sponsorship
  async unbookSponsorship(sponsorshipId: number): Promise<Sponsorship> {
    const unbooked = await this.makeRequest(`/sponsorships/${sponsorshipId}/unbook`, {
      method: 'POST',
    })
    await this.preloadSponsorships(true)
    return unbooked
  }

  // Get available sponsorships (not fully booked)
  async getAvailableSponsorships(): Promise<Sponsorship[]> {
    const sponsorships = await this.getSponsorships()
    return sponsorships.filter(sponsorship => !sponsorship.is_closed)
  }

  // Preload sponsorships and populate cache
  async preloadSponsorships(forceRefresh: boolean = false): Promise<Sponsorship[]> {
    if (!forceRefresh && this.sponsorshipsCache) {
      return this.sponsorshipsCache
    }
    return await this.getSponsorships()
  }

  // Get cached sponsorships (may be empty)
  getCachedSponsorships(): Sponsorship[] {
    return this.sponsorshipsCache ? [...this.sponsorshipsCache] : []
  }

  // Get cached available sponsorships
  getCachedAvailableSponsorships(): Sponsorship[] {
    return this.getCachedSponsorships().filter(s => !s.is_closed)
  }

  // Subscribe to sponsorship updates
  subscribe(listener: (sponsorships: Sponsorship[]) => void): () => void {
    this.subscribers.push(listener)
    return () => {
      this.subscribers = this.subscribers.filter(l => l !== listener)
    }
  }

  private notifySubscribers() {
    if (!this.sponsorshipsCache) return
    const snapshot = [...this.sponsorshipsCache]
    this.subscribers.forEach(listener => {
      try { listener(snapshot) } catch {}
    })
  }

  // Update token (for syncing with auth service)
  updateToken(token: string) {
    this.token = token
  }

  // Clear token
  clearToken() {
    this.token = null
    this.sponsorshipsCache = null
  }
}

// Export a singleton instance
export const sponsorshipsService = new SponsorshipsService()
