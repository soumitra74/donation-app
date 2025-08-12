import { useState, useEffect } from 'react'
import { LoginForm } from './components/login-form'
import { DonationDashboard } from './components/donation-dashboard'
import './App.css'

interface User {
  id: string
  email: string
  name: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem("donation-app-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show login form if user is not logged in
  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Show dashboard if user is logged in
  return <DonationDashboard user={user} onLogout={handleLogout} />
}

export default App
