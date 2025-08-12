"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DonationForm } from "@/components/donation-form"
import { LogOut, Plus, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
}

interface Donation {
  id: string
  donorName: string
  amount: number
  tower: number
  floor: number
  unit: number
  phoneNumber?: string
  headCount?: number
  volunteerId: string
  volunteerName: string
  timestamp: string
  paymentMethod?: string
  upiPerson?: string
  sponsorship?: string
  notes?: string
}

interface DonationDashboardProps {
  user: User
  onLogout: () => void
}

export function DonationDashboard({ user, onLogout }: DonationDashboardProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedApartment, setSelectedApartment] = useState<{ tower: number; floor: number; unit: number } | null>(
    null,
  )
  const [currentTowerIndex, setCurrentTowerIndex] = useState(0)

  const assignedTowers = [1, 2, 3] // Example: volunteer assigned to towers 1, 2, 3

  useEffect(() => {
    // Load donations from localStorage
    const savedDonations = localStorage.getItem("donation-app-donations")
    if (savedDonations) {
      setDonations(JSON.parse(savedDonations))
    }
  }, [])

  const handleAddDonation = (donation: Omit<Donation, "id" | "volunteerId" | "volunteerName" | "timestamp">) => {
    const newDonation: Donation = {
      ...donation,
      id: Date.now().toString(),
      volunteerId: user.id,
      volunteerName: user.name,
      timestamp: new Date().toISOString(),
    }

    const updatedDonations = [...donations, newDonation]
    setDonations(updatedDonations)
    localStorage.setItem("donation-app-donations", JSON.stringify(updatedDonations))
    setShowForm(false)
    setSelectedApartment(null)
  }

  const getApartmentStatus = (tower: number, floor: number, unit: number) => {
    const donation = donations.find((d) => d.tower === tower && d.floor === floor && d.unit === unit)
    if (donation) return "donated"

    // Mock logic for visited/skipped apartments (would come from backend)
    const apartmentKey = `${tower}-${floor}-${unit}`
    const visitedApartments = JSON.parse(localStorage.getItem("visited-apartments") || "[]")
    const skippedApartments = JSON.parse(localStorage.getItem("skipped-apartments") || "[]")

    if (skippedApartments.includes(apartmentKey)) return "skipped"
    if (visitedApartments.includes(apartmentKey)) return "visited"
    return "not-visited"
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

  const myDonations = donations.filter((d) => d.volunteerId === user.id)
  const totalAmount = myDonations.reduce((sum, d) => sum + d.amount, 0)
  const totalDonors = myDonations.length

  const nextTower = () => {
    setCurrentTowerIndex((prev) => (prev + 1) % assignedTowers.length)
  }

  const prevTower = () => {
    setCurrentTowerIndex((prev) => (prev - 1 + assignedTowers.length) % assignedTowers.length)
  }

  if (showForm) {
    return (
      <DonationForm
        onSubmit={handleAddDonation}
        onCancel={() => {
          setShowForm(false)
          setSelectedApartment(null)
        }}
        preselectedApartment={selectedApartment}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden on mobile */}
      <header className="bg-white shadow-sm border-b hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Donation Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="sm:hidden bg-white shadow-sm border-b px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-600">{user.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Desktop Grid Layout */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {assignedTowers.map((tower) => (
            <Card key={tower} className="overflow-hidden">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-base">Block {String.fromCharCode(64 + tower)}</CardTitle>
                <CardDescription className="text-xs">Tap apartment to record</CardDescription>
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

                      return (
                        <button
                          key={`${floor}-${unit}`}
                          onClick={() => handleApartmentClick(tower, floor, unit)}
                          className={`
                            h-8 w-full flex items-center justify-center rounded text-xs font-medium transition-colors active:scale-95
                            ${status === "donated" ? "bg-green-100 text-green-800 border border-green-300" : ""}
                            ${status === "visited" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" : ""}
                            ${status === "skipped" ? "bg-red-100 text-red-800 border border-red-300" : ""}
                            ${status === "not-visited" ? "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 active:bg-gray-300" : ""}
                          `}
                        >
                          {apartmentNumber}
                        </button>
                      )
                    })
                  }).flat()}
                </div>

                <div className="mt-3 flex flex-wrap gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-xs">Donated</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-100 border border-yellow-300 rounded"></div>
                    <span className="text-xs">Visited</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-100 border border-red-300 rounded"></div>
                    <span className="text-xs">Skip</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-100 border border-gray-200 rounded"></div>
                    <span className="text-xs">Pending</span>
                  </div>
                </div>
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
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Block {String.fromCharCode(64 + assignedTowers[currentTowerIndex])}
                </h2>
                <p className="text-xs text-gray-600">
                  {currentTowerIndex + 1} of {assignedTowers.length}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={nextTower}
                className="h-8 w-8 p-0"
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
                {assignedTowers.map((tower) => (
                  <div key={tower} className="w-full flex-shrink-0">
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-2 px-3 pt-3">
                        <CardTitle className="text-base">Block {String.fromCharCode(64 + tower)}</CardTitle>
                        <CardDescription className="text-xs">Tap apartment to record</CardDescription>
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

                              return (
                                <button
                                  key={`${floor}-${unit}`}
                                  onClick={() => handleApartmentClick(tower, floor, unit)}
                                  className={`
                                    h-8 w-full flex items-center justify-center rounded text-xs font-medium transition-colors active:scale-95
                                    ${status === "donated" ? "bg-green-100 text-green-800 border border-green-300" : ""}
                                    ${status === "visited" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" : ""}
                                    ${status === "skipped" ? "bg-red-100 text-red-800 border border-red-300" : ""}
                                    ${status === "not-visited" ? "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 active:bg-gray-300" : ""}
                                  `}
                                >
                                  {apartmentNumber}
                                </button>
                              )
                            })
                          }).flat()}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-100 border border-green-300 rounded"></div>
                            <span className="text-xs">Donated</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-100 border border-yellow-300 rounded"></div>
                            <span className="text-xs">Visited</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-100 border border-red-300 rounded"></div>
                            <span className="text-xs">Skip</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-100 border border-gray-200 rounded"></div>
                            <span className="text-xs">Pending</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center mt-4 space-x-2">
              {assignedTowers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTowerIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTowerIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From {totalDonors} donations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Donations Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDonors}</div>
              <p className="text-xs text-muted-foreground">Collected by you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalDonors > 0 ? Math.round(totalAmount / totalDonors) : 0}</div>
              <p className="text-xs text-muted-foreground">Per donation</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Donation Button */}
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Record New Donation
          </Button>
        </div>

        {/* Recent Donations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
            <CardDescription>Your latest donation records</CardDescription>
          </CardHeader>
          <CardContent>
            {myDonations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No donations recorded yet. Click on apartment numbers above to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {myDonations
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 10)
                  .map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{donation.donorName}</span>
                          <Badge variant="secondary">
                            {getApartmentNumber(donation.tower, donation.floor, donation.unit)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(donation.timestamp).toLocaleDateString()} at{" "}
                          {new Date(donation.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">₹{donation.amount}</div>
                        {donation.headCount && <p className="text-xs text-gray-500">{donation.headCount} people</p>}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
