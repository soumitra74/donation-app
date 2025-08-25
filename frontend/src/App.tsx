import { useState, useEffect } from 'react'
import { LoginForm } from './components/login-form'
import { DonationDashboard } from './components/donation-dashboard'
import { authService, User, UserRole } from './services/auth'
import { donationsService } from './services/donations'
import { ThemeProvider, useTheme } from './components/theme-provider'
import './App.css'

interface AuthenticatedUser {
  user: User
  roles: UserRole[]
}

function AppContent() {
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          // Verify token by getting user profile
          const profile = await authService.getProfile()
          setAuthenticatedUser(profile)
          // Sync token with donations service
          const token = authService.getToken()
          if (token) {
            donationsService.updateToken(token)
          }
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
        // Token might be invalid, clear it
        authService.logout()
        donationsService.clearToken()
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  const handleLogin = (userData: { user: User; roles: UserRole[] }) => {
    setAuthenticatedUser(userData)
    localStorage.setItem("donation-app-user", JSON.stringify(userData))
    // Sync token with donations service
    const token = authService.getToken()
    if (token) {
      donationsService.updateToken(token)
    }
  }

  const handleLogout = () => {
    setAuthenticatedUser(null)
    authService.logout()
    // Clear token from donations service
    donationsService.clearToken()
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show login form if user is not authenticated
  if (!authenticatedUser) {
    return <LoginForm onLogin={handleLogin} theme={theme} />
  }

  // Show dashboard if user is authenticated
  return (
    <DonationDashboard 
      user={authenticatedUser.user} 
      roles={authenticatedUser.roles}
      onLogout={handleLogout} 
      theme={theme} 
    />
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App

