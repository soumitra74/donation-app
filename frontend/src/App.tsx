import { useState, useEffect } from 'react'
import { LoginForm } from './components/login-form'
import { DonationDashboard } from './components/donation-dashboard'
import { authService, User, UserRole } from './services/auth'
import './App.css'

type Theme = 'light' | 'dark' | 'ambient'

interface AuthenticatedUser {
  user: User
  roles: UserRole[]
}

function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          // Verify token by getting user profile
          const profile = await authService.getProfile()
          setAuthenticatedUser(profile)
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
        // Token might be invalid, clear it
        authService.logout()
      } finally {
        setLoading(false)
      }
    }

    // Load saved theme
    const savedTheme = localStorage.getItem("donation-app-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }

    initializeApp()
  }, [])

  const handleLogin = (userData: { user: User; roles: UserRole[] }) => {
    setAuthenticatedUser(userData)
    localStorage.setItem("donation-app-user", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setAuthenticatedUser(null)
    authService.logout()
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem("donation-app-theme", newTheme)
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
    return <LoginForm onLogin={handleLogin} theme={theme} onThemeChange={handleThemeChange} />
  }

  // Show dashboard if user is authenticated
  return (
    <DonationDashboard 
      user={authenticatedUser.user} 
      roles={authenticatedUser.roles}
      onLogout={handleLogout} 
      theme={theme} 
      onThemeChange={handleThemeChange} 
    />
  )
}

export default App

