"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { authService } from "@/services/auth"
import { X, UserPlus, Copy, Check } from "lucide-react"

interface AddUserProps {
  onSuccess: () => void
  onCancel: () => void
  theme: 'light' | 'dark' | 'ambient'
}

interface InviteResponse {
  message: string
  invite: {
    email: string
    name: string
    invite_code: string
    system_password: string | null
    role: string
    assigned_towers: number[]
    expires_at: string
    invite_url: string
  }
}

export function AddUser({ onSuccess, onCancel, theme }: AddUserProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'collector',
    assigned_towers: '',
    generate_system_password: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<InviteResponse | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Parse assigned towers
      const assignedTowers = formData.assigned_towers
        .split(',')
        .map(tower => tower.trim())
        .filter(tower => tower !== '')
        .map(tower => parseInt(tower))
        .filter(tower => !isNaN(tower))

      const response = await authService.createInvite({
        email: formData.email,
        name: formData.name,
        role: formData.role,
        assigned_towers: assignedTowers,
        generate_system_password: formData.generate_system_password
      })

      setSuccess(response)
    } catch (err: any) {
      setError(err.message || 'Failed to create invite')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900'
      case 'ambient':
        return 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'
      default:
        return 'bg-gray-50'
    }
  }

  const getCardClasses = () => {
    switch (theme) {
      case 'ambient':
        return 'bg-white/10 backdrop-blur-md border-white/20'
      case 'dark':
        return 'bg-gray-800 border-gray-700'
      default:
        return 'bg-white'
    }
  }

  const getTextClasses = () => {
    switch (theme) {
      case 'ambient':
        return 'text-white'
      case 'dark':
        return 'text-white'
      default:
        return 'text-gray-900'
    }
  }

  const getSecondaryTextClasses = () => {
    switch (theme) {
      case 'ambient':
        return 'text-white/80'
      case 'dark':
        return 'text-gray-300'
      default:
        return 'text-gray-600'
    }
  }

  const getInputClasses = () => {
    switch (theme) {
      case 'ambient':
        return 'bg-white/10 border-white/20 text-white placeholder-white/50'
      case 'dark':
        return 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      default:
        return 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
    }
  }

  const getButtonClasses = () => {
    switch (theme) {
      case 'ambient':
        return 'bg-blue-500/80 hover:bg-blue-500 text-white backdrop-blur-md'
      case 'dark':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const getOutlineButtonClasses = () => {
    switch (theme) {
      case 'ambient':
        return 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md'
      case 'dark':
        return 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
      default:
        return 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${getThemeClasses()}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel}></div>
      
      {/* Modal */}
      <Card className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${getCardClasses()}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`flex items-center ${getTextClasses()}`}>
                <UserPlus className="h-5 w-5 mr-2" />
                Add New User
              </CardTitle>
              <CardDescription className={getSecondaryTextClasses()}>
                Create an invite for a new user
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className={`h-8 w-8 p-0 ${getSecondaryTextClasses()}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className={getSecondaryTextClasses()}>
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className={getInputClasses()}
                  placeholder="user@example.com"
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className={getSecondaryTextClasses()}>
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className={getInputClasses()}
                  placeholder="John Doe"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className={getSecondaryTextClasses()}>
                  Role *
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger className={getInputClasses()}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collector">Collector</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned Towers */}
              <div className="space-y-2">
                <Label htmlFor="towers" className={getSecondaryTextClasses()}>
                  Assigned Towers (comma-separated)
                </Label>
                <Input
                  id="towers"
                  type="text"
                  value={formData.assigned_towers}
                  onChange={(e) => handleInputChange('assigned_towers', e.target.value)}
                  className={getInputClasses()}
                  placeholder="1, 2, 3"
                />
                <p className={`text-xs ${getSecondaryTextClasses()}`}>
                  Leave empty for admin users or to assign all towers
                </p>
              </div>

              {/* Generate System Password */}
              <div className="flex items-center space-x-2">
                <input
                  id="generate-password"
                  type="checkbox"
                  checked={formData.generate_system_password}
                  onChange={(e) => handleInputChange('generate_system_password', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="generate-password" className={getSecondaryTextClasses()}>
                  Generate system password
                </Label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className={getOutlineButtonClasses()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className={getButtonClasses()}
                >
                  {loading ? 'Creating...' : 'Create Invite'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="p-3 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-800 text-sm font-medium">
                  Invite created successfully!
                </p>
              </div>

              {/* Invite Details */}
              <div className="space-y-3">
                <h3 className={`font-medium ${getTextClasses()}`}>Invite Details</h3>
                
                <div className="space-y-2">
                  <Label className={getSecondaryTextClasses()}>Email</Label>
                  <p className={`font-mono text-sm ${getTextClasses()}`}>{success.invite.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className={getSecondaryTextClasses()}>Name</Label>
                  <p className={`font-mono text-sm ${getTextClasses()}`}>{success.invite.name}</p>
                </div>

                <div className="space-y-2">
                  <Label className={getSecondaryTextClasses()}>Role</Label>
                  <p className={`font-mono text-sm ${getTextClasses()}`}>{success.invite.role}</p>
                </div>

                <div className="space-y-2">
                  <Label className={getSecondaryTextClasses()}>Invite Code</Label>
                  <div className="flex items-center space-x-2">
                    <p className={`font-mono text-sm flex-1 p-2 bg-gray-100 rounded ${getTextClasses()}`}>
                      {success.invite.invite_code}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(success.invite.invite_code, 'code')}
                      className={getOutlineButtonClasses()}
                    >
                      {copiedField === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {success.invite.system_password && (
                  <div className="space-y-2">
                    <Label className={getSecondaryTextClasses()}>System Password</Label>
                    <div className="flex items-center space-x-2">
                      <p className={`font-mono text-sm flex-1 p-2 bg-gray-100 rounded ${getTextClasses()}`}>
                        {success.invite.system_password}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(success.invite.system_password!, 'password')}
                        className={getOutlineButtonClasses()}
                      >
                        {copiedField === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className={getSecondaryTextClasses()}>Invite URL</Label>
                  <div className="flex items-center space-x-2">
                    <p className={`font-mono text-sm flex-1 p-2 bg-gray-100 rounded ${getTextClasses()}`}>
                      {success.invite.invite_url}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(success.invite.invite_url, 'url')}
                      className={getOutlineButtonClasses()}
                    >
                      {copiedField === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={getSecondaryTextClasses()}>Expires At</Label>
                  <p className={`font-mono text-sm ${getTextClasses()}`}>
                    {new Date(success.invite.expires_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  onClick={() => {
                    setSuccess(null)
                    setFormData({
                      email: '',
                      name: '',
                      role: 'collector',
                      assigned_towers: '',
                      generate_system_password: false
                    })
                  }}
                  className={getOutlineButtonClasses()}
                >
                  Create Another
                </Button>
                <Button
                  onClick={onSuccess}
                  className={getButtonClasses()}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
