"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, UserRole } from "@/services/auth"
import { ArrowLeft, Upload, Trash2, Download, User as UserIcon } from "lucide-react"

interface ProfileProps {
  user: User
  roles: UserRole[]
  onBack: () => void
  theme: 'light' | 'dark' | 'ambient'
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

export function Profile({ user, roles, onBack, theme }: ProfileProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadQrCode()
  }, [])

  const loadQrCode = async () => {
    try {
      const token = localStorage.getItem('donation-app-token')
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/users/qr-code`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setQrCodeUrl(url)
      }
    } catch (error) {
      console.error('Failed to load QR code:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (PNG, JPEG, JPG, GIF, or BMP)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      setError(null)
      setSuccess(null)

      const reader = new FileReader()
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1] // Remove data URL prefix
        
        const token = localStorage.getItem('donation-app-token')
        if (!token) {
          setError('Authentication required')
          return
        }

        const response = await fetch(`${API_BASE_URL}/users/qr-code`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qr_code_data: base64Data,
            qr_code_mime_type: file.type,
          }),
        })

        if (response.ok) {
          setSuccess('QR code uploaded successfully!')
          await loadQrCode() // Reload the QR code
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to upload QR code')
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      setError('Failed to upload QR code')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteQrCode = async () => {
    try {
      setDeleting(true)
      setError(null)
      setSuccess(null)

      const token = localStorage.getItem('donation-app-token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`${API_BASE_URL}/users/qr-code`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setSuccess('QR code deleted successfully!')
        setQrCodeUrl(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete QR code')
      }
    } catch (error) {
      setError('Failed to delete QR code')
      console.error('Delete error:', error)
    } finally {
      setDeleting(false)
    }
  }

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'min-h-screen bg-gray-900'
      case 'ambient':
        return 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden'
      default:
        return 'min-h-screen bg-gray-50'
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

  return (
    <div className={getThemeClasses()}>
      {/* Ambient theme background effects */}
      {theme === 'ambient' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-indigo-500/20"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </>
      )}

      {/* Header */}
      <header className={`shadow-sm border-b relative z-10 ${
        theme === 'ambient' 
          ? 'bg-white/10 backdrop-blur-md border-white/20' 
          : theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="outline"
              onClick={onBack}
              className={`mr-4 ${
                theme === 'ambient' 
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                  : theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className={`text-xl font-semibold ${getTextClasses()}`}>
              Profile
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Information */}
          <Card className={getCardClasses()}>
            <CardHeader>
              <CardTitle className={`flex items-center ${getTextClasses()}`}>
                <UserIcon className="h-5 w-5 mr-2" />
                User Information
              </CardTitle>
              <CardDescription className={getSecondaryTextClasses()}>
                Your account details and assigned roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className={getSecondaryTextClasses()}>Name</Label>
                <p className={`font-medium ${getTextClasses()}`}>{user.name}</p>
              </div>
              <div>
                <Label className={getSecondaryTextClasses()}>Email</Label>
                <p className={`font-medium ${getTextClasses()}`}>{user.email}</p>
              </div>
              <div>
                <Label className={getSecondaryTextClasses()}>User ID</Label>
                <p className={`font-medium ${getTextClasses()}`}>{user.id}</p>
              </div>
              <div>
                <Label className={getSecondaryTextClasses()}>Roles</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {roles.map((role, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role.role === 'admin' 
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {role.role}
                      {role.assigned_towers.length > 0 && (
                        <span className="ml-1">
                          (Towers: {role.assigned_towers.join(', ')})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Management */}
          <Card className={getCardClasses()}>
            <CardHeader>
              <CardTitle className={getTextClasses()}>QR Code</CardTitle>
              <CardDescription className={getSecondaryTextClasses()}>
                Upload a QR code image for your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-100 border border-green-300 rounded-md">
                  <p className="text-green-800 text-sm">{success}</p>
                </div>
              )}

              {/* QR Code Display */}
              {qrCodeUrl && (
                <div className="text-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="mx-auto max-w-48 max-h-48 border rounded-lg shadow-sm"
                  />
                  <div className="mt-3 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = qrCodeUrl
                        link.download = 'qr-code.png'
                        link.click()
                      }}
                      className={`${
                        theme === 'ambient' 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                          : theme === 'dark'
                          ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteQrCode}
                      disabled={deleting}
                      className={`${
                        theme === 'ambient' 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                          : theme === 'dark'
                          ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <div className="space-y-3">
                <Label htmlFor="qr-upload" className={getSecondaryTextClasses()}>
                  Upload QR Code Image
                </Label>
                 <div className="flex items-center gap-3">
                   <div className="flex-1">
                     <Input
                       id="qr-upload"
                       type="file"
                       accept="image/png,image/jpeg,image/jpg,image/gif,image/bmp"
                       onChange={handleFileUpload}
                       disabled={uploading}
                       className={`${
                         theme === 'ambient' 
                           ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                           : theme === 'dark'
                           ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                           : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                       }`}
                     />
                   </div>
                   <Button
                     onClick={() => document.getElementById('qr-upload')?.click()}
                     disabled={uploading}
                     className={`${
                       theme === 'ambient' 
                         ? 'bg-blue-500/80 hover:bg-blue-500 text-white backdrop-blur-md' 
                         : 'bg-blue-600 hover:bg-blue-700'
                     }`}
                   >
                     <Upload className="h-4 w-4 mr-2" />
                     {uploading ? 'Uploading...' : 'Upload'}
                   </Button>
                 </div>
                <p className={`text-xs ${getSecondaryTextClasses()}`}>
                  Supported formats: PNG, JPEG, JPG, GIF, BMP (max 5MB)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
