import { useState, useEffect } from 'react'
import { LoginForm } from './components/login-form'
import { DonationDashboard } from './components/donation-dashboard'
import './App.css'

interface User {
  id: string
  email: string
  name: string
}

type Theme = 'light' | 'dark' | 'ambient'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    // Create test user if it doesn't exist
    const createTestUser = () => {
      const volunteers = JSON.parse(localStorage.getItem("donation-app-volunteers") || "[]")
      const existingUser = volunteers.find((v: any) => v.email === "soumitraghosh@hotmail.com")
      
      if (!existingUser) {
        const testUser = {
          id: "test-user-1",
          email: "soumitraghosh@hotmail.com",
          password: "123",
          name: "Soumitra Ghosh"
        }
        
        volunteers.push(testUser)
        localStorage.setItem("donation-app-volunteers", JSON.stringify(volunteers))
        console.log("Test user created:", testUser.email)
      }
    }
    
    createTestUser()
    
    // Check if user is logged in
    const savedUser = localStorage.getItem("donation-app-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    
    // Check for saved theme
    const savedTheme = localStorage.getItem("donation-app-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
    
    setLoading(false)
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    localStorage.setItem("donation-app-user", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("donation-app-user")
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

  // Show login form if user is not logged in
  if (!user) {
    return <LoginForm onLogin={handleLogin} theme={theme} onThemeChange={handleThemeChange} />
  }

  // Show dashboard if user is logged in
  return <DonationDashboard user={user} onLogout={handleLogout} theme={theme} onThemeChange={handleThemeChange} />
}

export default App
