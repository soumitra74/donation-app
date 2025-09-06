"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DonationForm } from "@/components/donation-form"
import { Profile } from "@/components/profile"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogOut, Plus, TrendingUp, ChevronLeft, ChevronRight, Download, User as UserIcon, Gift, X as XIcon } from "lucide-react"
import { User, UserRole } from "@/services/auth"
import { donationsService, Donation, DonationStats } from "@/services/donations"

interface DonationDashboardProps {
  user: User
  roles: UserRole[]
  onLogout: () => void
  onNavigateToUserManagement?: () => void
  onNavigateToSponsorshipManagement?: () => void
  theme: 'light' | 'dark' | 'ambient'
}

export function DonationDashboard({ user, roles, onLogout, onNavigateToUserManagement, onNavigateToSponsorshipManagement, theme }: DonationDashboardProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [stats, setStats] = useState<DonationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedApartment, setSelectedApartment] = useState<{ tower: number; floor: number; unit: number } | null>(
    null,
  )
  const [currentTowerIndex, setCurrentTowerIndex] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [recentDonations, setRecentDonations] = useState<Donation[]>([])
  const [recentTotalCount, setRecentTotalCount] = useState(0)
  const [recentLoading, setRecentLoading] = useState(false)

  // Get assigned towers from user roles
  const assignedTowers = roles.reduce((towers: number[], role) => {
    if (role.role === 'admin') {
      // Admin has access to all towers
      return [1, 2, 3, 4, 5, 6, 7, 8, 10]
    }
    return [...towers, ...role.assigned_towers]
  }, [])

  // Remove duplicates and sort
  const uniqueAssignedTowers = [...new Set(assignedTowers)].sort((a, b) => a - b)

  // Check if user is admin
  const isAdmin = roles.some(role => role.role === 'admin')

  useEffect(() => {
    const loadDonations = async () => {
      try {
        setLoading(true)
        const [donationsData, statsData] = await Promise.all([
          // If admin, get all donations, otherwise get user's donations
          isAdmin ? donationsService.getDonations() : donationsService.getMyDonations(parseInt(user.id)),
          donationsService.getStats()
        ])
        setDonations(donationsData)
        setStats(statsData)
        setCurrentPage(1)
      } catch (error) {
        console.error('Failed to load donations:', error)
        // Fallback to localStorage if API fails
        const savedDonations = localStorage.getItem("donation-app-donations")
        if (savedDonations) {
          setDonations(JSON.parse(savedDonations))
        }
      } finally {
        setLoading(false)
      }
    }

    loadDonations()
  }, [user.id, isAdmin])

  // Load recent donations from backend with pagination
  const loadRecentPage = async () => {
    try {
      setRecentLoading(true)
      const result = isAdmin
        ? await donationsService.getDonationsPaginated({ page: currentPage, page_size: pageSize })
        : await donationsService.getMyDonationsPaginated(parseInt(user.id), currentPage, pageSize)
      setRecentDonations(result.items)
      setRecentTotalCount(result.totalCount)
    } catch (error) {
      console.error('Failed to load recent donations:', error)
      // Fallback to client-side slice if server pagination fails
      const sorted = [...donations].sort((a: Donation, b: Donation) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize
      setRecentDonations(sorted.slice(start, end))
      setRecentTotalCount(sorted.length)
    } finally {
      setRecentLoading(false)
    }
  }

  useEffect(() => {
    loadRecentPage()
  }, [currentPage, pageSize, isAdmin, user.id])

  const getApartmentStatus = (tower: number, floor: number, unit: number) => {
    const donation = donations.find((d) => d.tower === tower && d.floor === floor && d.unit === unit)
    if (donation) {
      if (donation.status === 'completed') return "donated"
      if (donation.status === 'follow-up') return "follow-up"
      if (donation.status === 'skipped') return "skipped"
      return "donated" // Default to donated for other statuses
    }

    return "not-visited"
  }

  const refreshDonations = async () => {
    try {
      setLoading(true)
      const [donationsData, statsData] = await Promise.all([
        // If admin, get all donations, otherwise get user's donations
        isAdmin ? donationsService.getDonations() : donationsService.getMyDonations(parseInt(user.id)),
        donationsService.getStats()
      ])
      setDonations(donationsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to refresh donations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      setExporting(true)
      await donationsService.exportToExcel()
    } catch (error) {
      console.error('Failed to export Excel:', error)
      alert('Failed to export Excel file. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const recentTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(recentTotalCount / pageSize))
  }, [recentTotalCount, pageSize])

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  const handleDeleteDonation = async (donationId: number) => {
    if (!isAdmin) return
    const confirmed = window.confirm('Delete this donation? This cannot be undone.')
    if (!confirmed) return
    try {
      await donationsService.deleteDonation(donationId)
      await refreshDonations()
    } catch (error) {
      console.error('Failed to delete donation:', error)
      alert('Failed to delete donation. Please try again.')
    }
  }

  const getApartmentNumber = (tower: number, floor: number, unit: number) => {
    const towerLetter = String.fromCharCode(64 + tower) // A, B, C, etc.
    return `${towerLetter}${floor.toString()}${unit.toString().padStart(2, "0")}`
  }

  const handleApartmentClick = (tower: number, floor: number, unit: number) => {
    console.log(tower, floor, unit)
    setSelectedApartment({ tower, floor, unit })
    setShowForm(true)
  }

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)
  const totalDonors = donations.filter(d => d.status === 'completed').length

  const nextTower = () => {
    setCurrentTowerIndex((prev) => (prev + 1) % uniqueAssignedTowers.length)
  }

  const prevTower = () => {
    setCurrentTowerIndex((prev) => (prev - 1 + uniqueAssignedTowers.length) % uniqueAssignedTowers.length)
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

  // Render legend component
  const renderLegend = () => (
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
        <span className={`text-xs ${
          theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Donated
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
        <span className={`text-xs ${
          theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Follow-up
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-slate-200 border border-slate-400 rounded"></div>
        <span className={`text-xs ${
          theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Skip
        </span>
      </div>
    </div>
  )

  if (showForm) {
    return <DonationForm
      onCancel={() => {
        setShowForm(false)
        setSelectedApartment(null)
      }}
      preselectedApartment={selectedApartment}
      user={user}
      onDonationCreated={refreshDonations}
      theme={theme}
    />
  }

  if (showProfile) {
    return <Profile
      user={user}
      roles={roles}
      onBack={() => setShowProfile(false)}
      theme={theme}
    />
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

      {/* Header - Hidden on mobile */}
      <header className={`shadow-sm border-b hidden sm:block relative z-10 ${
        theme === 'ambient' 
          ? 'bg-white/10 backdrop-blur-md border-white/20' 
          : theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className={`text-xl font-semibold ${
                theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Donation Dashboard {isAdmin && '(Admin View)'}
              </h1>
              <p className={`text-sm ${
                theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Welcome back, {user.name}
              </p>
            </div>
            
            {/* Centered Theme Toggle */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <ThemeToggle />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onLogout}
                className={`${
                  theme === 'ambient' 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                    : theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <div className={`sm:hidden shadow-sm border-b px-4 py-3 relative z-10 ${
        theme === 'ambient' 
          ? 'bg-white/10 backdrop-blur-md border-white/20' 
          : theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
                  <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-lg font-semibold ${
                theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Dashboard {isAdmin && '(Admin)'}
              </h1>
              <p className={`text-xs ${
                theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {user.name}
              </p>
            </div>
            
            {/* Centered Theme Toggle */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <ThemeToggle />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowProfile(true)}
                className={`${
                  theme === 'ambient' 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                    : theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className={`${
                  theme === 'ambient' 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                    : theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Desktop Grid Layout */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {uniqueAssignedTowers.map((tower) => (
            <Card key={tower} className={`overflow-hidden ${
              theme === 'ambient' 
                ? 'bg-white/10 backdrop-blur-md border-white/20' 
                : theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white'
            }`}>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className={`text-base ${
                  theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Block {String.fromCharCode(64 + tower)}
                </CardTitle>
                <CardDescription className={`text-xs ${
                  theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Tap apartment to record
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-4 gap-1 text-xs">
                  {/* Generate 14 floors, 4 units each */}
                  {Array.from({ length: 14 }, (_, floorIndex) => {
                    const floor = 14 - floorIndex // Start from 14th floor down to 1st
                    return Array.from({ length: 4 }, (_, unitIndex) => {
                      const unit = unitIndex + 1
                      const status = getApartmentStatus(tower, floor, unit)
                      const apartmentNumber = getApartmentNumber(tower, floor, unit)

                      const getButtonClasses = () => {
                        const baseClasses = "h-8 w-full flex items-center justify-center rounded text-xs font-medium transition-colors active:scale-95"
                        
                        if (status === "donated") {
                          return `${baseClasses} bg-green-100 text-green-800 border border-green-300`
                        } else if (status === "skipped") {
                          return `${baseClasses} bg-slate-200 text-slate-800 border border-slate-400`
                        } else if (status === "follow-up") {
                          return `${baseClasses} bg-orange-100 text-orange-800 border border-orange-300`
                        } else {
                          // not-visited
                          if (theme === 'ambient') {
                            return `${baseClasses} bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 hover:text-white active:bg-white/30`
                          } else if (theme === 'dark') {
                            return `${baseClasses} bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:text-white active:bg-gray-500`
                          } else {
                            return `${baseClasses} bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 active:bg-gray-300`
                          }
                        }
                      }

                      return (
                        <button
                          key={`${floor}-${unit}`}
                          onClick={() => handleApartmentClick(tower, floor, unit)}
                          className={getButtonClasses()}
                        >
                          {apartmentNumber}
                        </button>
                      )
                    })
                  }).flat()}
                </div>

                {renderLegend()}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile Carousel Layout */}
        <div className="sm:hidden mb-8">
          <div className="relative">
            {/* Carousel Navigation */}
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={prevTower}
                className={`h-8 w-8 p-0 ${
                  theme === 'ambient' 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                    : theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className={`text-lg font-semibold ${
                  theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Block {String.fromCharCode(64 + uniqueAssignedTowers[currentTowerIndex])}
                </h2>
                <p className={`text-xs ${
                  theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {currentTowerIndex + 1} of {uniqueAssignedTowers.length}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={nextTower}
                className={`h-8 w-8 p-0 ${
                  theme === 'ambient' 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                    : theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Carousel Content */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentTowerIndex * 100}%)` }}
              >
                {uniqueAssignedTowers.map((tower) => (
                  <div key={tower} className="w-full flex-shrink-0">
                    <Card className={`overflow-hidden ${
                      theme === 'ambient' 
                        ? 'bg-white/10 backdrop-blur-md border-white/20' 
                        : theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white'
                    }`}>
                      <CardHeader className="pb-2 px-3 pt-3">
                        <CardTitle className={`text-base ${
                          theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          Block {String.fromCharCode(64 + tower)}
                        </CardTitle>
                        <CardDescription className={`text-xs ${
                          theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Tap apartment to record
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="grid grid-cols-4 gap-1 text-xs">
                          {/* Generate 14 floors, 4 units each */}
                          {Array.from({ length: 14 }, (_, floorIndex) => {
                            const floor = 14 - floorIndex // Start from 14th floor down to 1st
                            return Array.from({ length: 4 }, (_, unitIndex) => {
                              const unit = unitIndex + 1
                              const status = getApartmentStatus(tower, floor, unit)
                              const apartmentNumber = getApartmentNumber(tower, floor, unit)

                              const getButtonClasses = () => {
                                const baseClasses = "h-8 w-full flex items-center justify-center rounded text-xs font-medium transition-colors active:scale-95"
                                
                                if (status === "donated") {
                                  return `${baseClasses} bg-green-100 text-green-800 border border-green-300`
                                } else if (status === "visited") {
                                  return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-300`
                                } else if (status === "skipped") {
                                  return `${baseClasses} bg-slate-200 text-slate-800 border border-slate-400`
                                } else if (status === "follow-up") {
                                  return `${baseClasses} bg-orange-100 text-orange-800 border border-orange-300`
                                } else {
                                  // not-visited
                                  if (theme === 'ambient') {
                                    return `${baseClasses} bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 hover:text-white active:bg-white/30`
                                  } else if (theme === 'dark') {
                                    return `${baseClasses} bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:text-white active:bg-gray-500`
                                  } else {
                                    return `${baseClasses} bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 active:bg-gray-300`
                                  }
                                }
                              }

                              return (
                                <button
                                  key={`${floor}-${unit}`}
                                  onClick={() => handleApartmentClick(tower, floor, unit)}
                                  className={getButtonClasses()}
                                >
                                  {apartmentNumber}
                                </button>
                              )
                            })
                          }).flat()}
                        </div>

                        {renderLegend()}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center mt-4 space-x-2">
              {uniqueAssignedTowers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTowerIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTowerIndex 
                      ? theme === 'ambient' ? 'bg-white' : 'bg-blue-600'
                      : theme === 'ambient' ? 'bg-white/30' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className={`${
            theme === 'ambient' 
              ? 'bg-white/10 backdrop-blur-md border-white/20' 
              : theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${
                theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Total Collected
              </CardTitle>
              <TrendingUp className={`h-4 w-4 ${
                theme === 'ambient' ? 'text-white/60' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {loading ? (
                  <div className="animate-pulse bg-gray-300 h-8 w-24 rounded"></div>
                ) : (
                  `₹${stats ? stats.total_amount.toLocaleString() : totalAmount.toLocaleString()}`
                )}
              </div>
              <p className={`text-xs ${
                theme === 'ambient' ? 'text-white/60' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                From {stats ? stats.total_donations : totalDonors} donations
              </p>
            </CardContent>
          </Card>

          <Card className={`${
            theme === 'ambient' 
              ? 'bg-white/10 backdrop-blur-md border-white/20' 
              : theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${
                theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {isAdmin ? 'Total Donations' : 'My Donations'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {loading ? (
                  <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                ) : (
                  totalDonors
                )}
              </div>
              <p className={`text-xs ${
                theme === 'ambient' ? 'text-white/60' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {isAdmin ? 'All donations' : 'Collected by you'}
              </p>
            </CardContent>
          </Card>

          <Card className={`${
            theme === 'ambient' 
              ? 'bg-white/10 backdrop-blur-md border-white/20' 
              : theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${
                theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Average Donation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {loading ? (
                  <div className="animate-pulse bg-gray-300 h-8 w-20 rounded"></div>
                ) : (
                  `₹${stats ? Math.round(stats.average_donation) : (totalDonors > 0 ? Math.round(totalAmount / totalDonors) : 0)}`
                )}
              </div>
              <p className={`text-xs ${
                theme === 'ambient' ? 'text-white/60' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Per donation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Donation Button */}
        <div className="mb-6">
          <Button 
            onClick={() => setShowForm(true)} 
            className={`${
              theme === 'ambient' 
                ? 'bg-blue-500/80 hover:bg-blue-500 text-white backdrop-blur-md' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Record New Donation
          </Button>
        </div>

        {/* Recent Donations */}
        <Card className={`${
          theme === 'ambient' 
            ? 'bg-white/10 backdrop-blur-md border-white/20' 
            : theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white'
        }`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className={
                  theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
                }>
                  {isAdmin ? 'All Donations' : 'Block Donations'}
                </CardTitle>
                <CardDescription className={
                  theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }>
                  {isAdmin ? 'Donation records from all volunteers' : 'Your donation records'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className={
                    theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                    className={`${
                      theme === 'ambient'
                        ? 'bg-white/10 border-white/20 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700'
                    } rounded-md border px-2 py-1`}
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`${
                      theme === 'ambient' 
                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                        : theme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Prev
                  </Button>
                  <span className={
                    theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }>
                    {currentPage} / {recentTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(recentTotalPages, p + 1))}
                    disabled={currentPage >= recentTotalPages}
                    className={`${
                      theme === 'ambient' 
                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                        : theme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </Button>
                </div>
                <Button
                  onClick={handleExportExcel}
                  disabled={exporting}
                  variant="outline"
                  size="sm"
                  className={`${
                    theme === 'ambient' 
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                      : theme === 'dark'
                      ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <p className={`${
                theme === 'ambient' ? 'text-white/80' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>Loading...</p>
            ) : recentDonations.length === 0 ? (
              <p className={`text-center py-8 ${
                theme === 'ambient' ? 'text-white/60' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No donations recorded yet. Click on apartment numbers above to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {recentDonations.map((donation: Donation) => (
                    <div key={donation.id} className={`flex items-center justify-between p-4 border rounded-lg ${
                      theme === 'ambient' 
                        ? 'bg-white/5 border-white/10' 
                        : theme === 'dark'
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${
                            theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {donation.donor_name}
                          </span>
                          <Badge variant="secondary">
                            {getApartmentNumber(donation.tower, donation.floor, donation.unit)}
                          </Badge>
                          {isAdmin && donation.volunteer_name && (
                            <Badge variant="outline" className="text-xs">
                              by {donation.volunteer_name}
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm ${
                          theme === 'ambient' ? 'text-white/70' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {new Date(donation.created_at).toLocaleDateString()} at{" "}
                          {new Date(donation.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {isAdmin && (
                          <button
                            aria-label="Delete donation"
                            onClick={() => handleDeleteDonation(donation.id)}
                            className={`${
                              theme === 'ambient'
                                ? 'text-white/70 hover:text-white'
                                : theme === 'dark'
                                ? 'text-gray-300 hover:text-white'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        )}
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">₹{donation.amount}</div>
                          {donation.head_count && <p className={`text-xs ${
                            theme === 'ambient' ? 'text-white/50' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {donation.head_count} people
                          </p>}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Actions */}
        {isAdmin && (
          <Card className={`mt-6 ${theme === 'ambient' ? 'bg-white/10 backdrop-blur-md border-white/20' : theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Admin Actions
              </CardTitle>
              <CardDescription className={`${theme === 'ambient' ? 'text-white/70' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage users and system settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={onNavigateToUserManagement}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  User Management
                </Button>
                <Button 
                  onClick={onNavigateToSponsorshipManagement}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Sponsorship Management
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout Button at Bottom */}
        <div className="mt-8 mb-6 text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowProfile(true)}
            className={`${
              theme === 'ambient' 
                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                : theme === 'dark'
                ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Profile
          </Button>
          <div className="mt-2">
            <Button 
              variant="outline" 
              onClick={onLogout}
              className={`${
                theme === 'ambient' 
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md' 
                  : theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </main>


    </div>
  )
}