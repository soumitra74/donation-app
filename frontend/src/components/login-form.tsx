"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"
import { authService, User, UserRole } from "@/services/auth"

interface LoginFormProps {
  onLogin: (userData: { user: User; roles: UserRole[] }) => void
  theme: 'light' | 'dark' | 'ambient'
}

export function LoginForm({ onLogin, theme }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await authService.login(email, password)
      onLogin(response)
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
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
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
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
            Sign in to start collecting donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? "Please wait..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
