"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: string
  email: string
  name: string
}

interface LoginFormProps {
  onLogin: (user: User) => void
  theme: 'light' | 'dark' | 'ambient'
  onThemeChange: (theme: 'light' | 'dark' | 'ambient') => void
}

export function LoginForm({ onLogin, theme, onThemeChange }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isSignUp) {
        // Simple signup - in real app this would be server-side
        if (!name.trim()) {
          setError("Name is required for signup")
          return
        }

        const volunteers = JSON.parse(localStorage.getItem("donation-app-volunteers") || "[]")
        const existingVolunteer = volunteers.find((v: any) => v.email === email)

        if (existingVolunteer) {
          setError("Email already registered")
          return
        }

        const newVolunteer = {
          id: Date.now().toString(),
          email,
          password, // In real app, this would be hashed
          name: name.trim(),
        }

        volunteers.push(newVolunteer)
        localStorage.setItem("donation-app-volunteers", JSON.stringify(volunteers))

        onLogin({ id: newVolunteer.id, email, name: name.trim() })
      } else {
        // Simple login - in real app this would be server-side
        const volunteers = JSON.parse(localStorage.getItem("donation-app-volunteers") || "[]")
        console.log("Available volunteers:", volunteers)
        console.log("Attempting login with:", { email, password })
        
        // const volunteer = volunteers.find((v: any) => v.email === email && v.password === password)
        // hardcoding voluntree for now
        // TBD remove this after testing
        const volunteer = {id: "1", email: "soumitraghosh@hotmail.com", name: "Soumitra Ghosh"}
        console.log("Found volunteer:", volunteer)

        if (!volunteer) {
          setError("Invalid email or password")
          return
        }

        onLogin({ id: volunteer.id, email, name: volunteer.name })
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'min-h-screen flex items-center justify-center bg-gray-900 p-4'
      case 'ambient':
        return 'min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 relative overflow-hidden'
      default:
        return 'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'
    }
  }

  return (
    <div className={getThemeClasses()}>
      {/* Ambient theme background effects */}
      {theme === 'ambient' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-indigo-500/20"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent opacity-30"></div>
        </>
      )}
      
      {/* Theme Selector */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
          {(['light', 'dark', 'ambient'] as const).map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => onThemeChange(themeOption)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                theme === themeOption
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Card className={`w-full max-w-md relative z-10 ${
        theme === 'ambient' 
          ? 'bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl' 
          : theme === 'dark'
          ? 'bg-gray-800 border-gray-700 text-white'
          : 'bg-white'
      }`}>
        <CardHeader className="text-center">
          <CardTitle className={`text-2xl font-bold ${
            theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Donation Collection
          </CardTitle>
          <CardDescription className={
            theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }>
            {isSignUp ? "Create your volunteer account" : "Sign in to start collecting donations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className={theme === 'ambient' ? 'text-white' : ''}>Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                  className={theme === 'ambient' ? 'bg-white/20 border-white/30 text-white placeholder-white/50' : ''}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className={theme === 'ambient' ? 'text-white' : ''}>Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className={theme === 'ambient' ? 'bg-white/20 border-white/30 text-white placeholder-white/50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className={theme === 'ambient' ? 'text-white' : ''}>Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className={theme === 'ambient' ? 'bg-white/20 border-white/30 text-white placeholder-white/50' : ''}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError("")
              }}
              className={`text-sm hover:underline ${
                theme === 'ambient' ? 'text-white/80 hover:text-white' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
