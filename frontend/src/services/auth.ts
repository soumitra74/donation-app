/**
 * Authentication service for the donation app
 * Handles API calls to the backend authentication endpoints
 */

export interface User {
  id: string
  email: string
  name: string
}

export interface UserRole {
  role: string
  assigned_towers: number[]
}

export interface AuthResponse {
  message: string
  token: string
  user: User
  roles: UserRole[]
}

export interface InviteDetails {
  email: string
  name: string
  role: string
  assigned_towers: number[]
  has_system_password: boolean
  expires_at: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

class AuthService {
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

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    this.token = response.token
    localStorage.setItem('donation-app-token', response.token)
    
    return response
  }

  async register(inviteCode: string, email: string, name: string, password: string, useSystemPassword: boolean = false): Promise<AuthResponse> {
    const response = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        invite_code: inviteCode,
        email,
        name,
        password,
        use_system_password: useSystemPassword,
      }),
    })

    this.token = response.token
    localStorage.setItem('donation-app-token', response.token)
    
    return response
  }

  async googleAuth(googleToken: string, inviteCode: string): Promise<AuthResponse> {
    const response = await this.makeRequest('/auth/google-auth', {
      method: 'POST',
      body: JSON.stringify({
        google_token: googleToken,
        invite_code: inviteCode,
      }),
    })

    this.token = response.token
    localStorage.setItem('donation-app-token', response.token)
    
    return response
  }

  async getProfile(): Promise<{ user: User; roles: UserRole[] }> {
    return await this.makeRequest('/auth/profile')
  }

  async getInviteDetails(inviteCode: string): Promise<InviteDetails> {
    return await this.makeRequest(`/auth/invites/${inviteCode}`)
  }

  async createInvite(inviteData: {
    email: string
    name: string
    role: string
    assigned_towers: number[]
    generate_system_password?: boolean
  }): Promise<{ message: string; invite: any }> {
    return await this.makeRequest('/auth/invites', {
      method: 'POST',
      body: JSON.stringify(inviteData),
    })
  }

  async getInvites(): Promise<any[]> {
    return await this.makeRequest('/auth/invites')
  }

  async getUsers(): Promise<User[]> {
    return await this.makeRequest('/auth/users')
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return await this.makeRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
  }

  logout(): void {
    this.token = null
    localStorage.removeItem('donation-app-token')
    localStorage.removeItem('donation-app-user')
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  getToken(): string | null {
    return this.token
  }

  // Helper method to check if user has a specific role
  hasRole(roles: UserRole[], requiredRole: string): boolean {
    return roles.some(role => role.role === requiredRole)
  }

  // Helper method to check if user can access a specific tower
  canAccessTower(roles: UserRole[], tower: number): boolean {
    return roles.some(role => {
      if (role.role === 'admin') return true
      return role.assigned_towers.includes(tower)
    })
  }
}

export const authService = new AuthService()
