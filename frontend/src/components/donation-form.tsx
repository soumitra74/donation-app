"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { donationsService, CreateDonationData } from "@/services/donations"

interface DonationFormProps {
  onCancel: () => void
  preselectedApartment?: {
    tower: number
    floor: number
    unit: number
  } | null
  user?: {
    id: string
    name: string
  }
  onDonationCreated?: () => void
}

export function DonationForm({ onCancel, preselectedApartment, onDonationCreated }: DonationFormProps) {
  const [currentApartment, setCurrentApartment] = useState({
    tower: preselectedApartment?.tower || 1,
    floor: preselectedApartment?.floor || 1,
    unit: preselectedApartment?.unit || 1,
  })

  // Update currentApartment when preselectedApartment changes
  useEffect(() => {
    if (preselectedApartment) {
      setCurrentApartment({
        tower: preselectedApartment.tower,
        floor: preselectedApartment.floor,
        unit: preselectedApartment.unit,
      })
    }
  }, [preselectedApartment])

  const [formData, setFormData] = useState({
    donorName: "",
    amount: "",
    phoneNumber: "",
    headCount: "",
    paymentMethod: "cash" as "cash" | "upi-self" | "upi-other",
    upiOtherPerson: "",
    sponsorship: "",
    notes: "",
  })

  const getFlatNumber = () => {
    console.log(currentApartment)
    const towerLetter = String.fromCharCode(65 + currentApartment.tower - 1) // A, B, C, etc.
    const floorUnit = `${currentApartment.floor.toString()}${currentApartment.unit.toString().padStart(2, "0")}`
    return `${towerLetter}${floorUnit}`
  }

  const navigatePrevious = () => {
    setCurrentApartment((prev) => {
      let { tower, floor, unit } = prev

      unit--
      if (unit < 1) {
        unit = 4
        floor--
        if (floor < 1) {
          floor = 14
          tower--
          if (tower < 1) {
            tower = 10
          }
        }
      }

      return { tower, floor, unit }
    })
  }

  const navigateNext = () => {
    if(lastApartmentInTower()) {
      //go to home screen and show a message that this is the last apartment in the tower
      onCancel()
      return
    }
    setCurrentApartment((prev) => {
      let { tower, floor, unit } = prev

      unit++
      if (unit > 4) {
        unit = 1
        floor++
        if (floor > 14) {
          floor = 1
          tower++
          if (tower > 10) {
            tower = 1
          }
        }
      }

      return { tower, floor, unit }
    })
  }

  const lastApartmentInTower = () => {
    return currentApartment.tower === 10 && currentApartment.floor === 14 && currentApartment.unit === 4
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.donorName.trim() || !formData.amount.trim()) {
      alert("Please fill in all required fields")
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    try {
      const donationData: CreateDonationData = {
        donor_name: formData.donorName.trim(),
        amount: amount,
        tower: currentApartment.tower,
        floor: currentApartment.floor,
        unit: currentApartment.unit,
        phone_number: formData.phoneNumber.trim() || undefined,
        head_count: formData.headCount ? parseInt(formData.headCount) : undefined,
        payment_method: formData.paymentMethod,
        upi_other_person: formData.upiOtherPerson.trim() || undefined,
        sponsorship: formData.sponsorship.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      }

      await donationsService.createDonation(donationData)
      
      // Reset form
      setFormData({
        donorName: "",
        amount: "",
        phoneNumber: "",
        headCount: "",
        paymentMethod: "cash",
        upiOtherPerson: "",
        sponsorship: "",
        notes: "",
      })

      // Navigate to next apartment
      navigateNext()
      
      if (onDonationCreated) {
        onDonationCreated()
      }
    } catch (error) {
      console.error("Error creating donation:", error)
      alert("Failed to create donation. Please try again.")
    }
  }

  const handleSkip = async () => {
    try {
      await donationsService.markApartmentSkipped(
        currentApartment.tower,
        currentApartment.floor,
        currentApartment.unit,
        "Skipped by user"
      )
      
      navigateNext()
    } catch (error) {
      console.error("Error skipping apartment:", error)
      alert("Failed to skip apartment. Please try again.")
    }
  }

  const handleFollowUp = async () => {
    try {
      await donationsService.markApartmentFollowUp(
        currentApartment.tower,
        currentApartment.floor,
        currentApartment.unit,
        "Marked for follow-up"
      )
      
      navigateNext()
    } catch (error) {
      console.error("Error marking for follow-up:", error)
      alert("Failed to mark for follow-up. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Donation Form</h1>
              <p className="text-gray-600">Apartment: {getFlatNumber()}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={navigatePrevious}
                disabled={currentApartment.tower === 1 && currentApartment.floor === 1 && currentApartment.unit === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={navigateNext}
                disabled={lastApartmentInTower()}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="donorName" className="block text-sm font-medium text-gray-700 mb-1">
                  Donor Name *
                </label>
                <Input
                  id="donorName"
                  type="text"
                  value={formData.donorName}
                  onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                  placeholder="Enter donor name"
                  required
                />
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) *
                </label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label htmlFor="headCount" className="block text-sm font-medium text-gray-700 mb-1">
                  Head Count
                </label>
                <Input
                  id="headCount"
                  type="number"
                  value={formData.headCount}
                  onChange={(e) => setFormData({ ...formData, headCount: e.target.value })}
                  placeholder="Number of people"
                  min="1"
                />
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => 
                    setFormData({ ...formData, paymentMethod: value as "cash" | "upi-self" | "upi-other" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi-self">UPI (Self)</SelectItem>
                    <SelectItem value="upi-other">UPI (Other Person)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentMethod === "upi-other" && (
                <div>
                  <label htmlFor="upiOtherPerson" className="block text-sm font-medium text-gray-700 mb-1">
                    UPI Person Name
                  </label>
                  <Input
                    id="upiOtherPerson"
                    type="text"
                    value={formData.upiOtherPerson}
                    onChange={(e) => setFormData({ ...formData, upiOtherPerson: e.target.value })}
                    placeholder="Enter UPI person name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="sponsorship" className="block text-sm font-medium text-gray-700 mb-1">
                  Sponsorship
                </label>
                <Input
                  id="sponsorship"
                  type="text"
                  value={formData.sponsorship}
                  onChange={(e) => setFormData({ ...formData, sponsorship: e.target.value })}
                  placeholder="Enter sponsorship details"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Submit Donation
              </Button>
              <Button type="button" variant="outline" onClick={handleFollowUp} className="flex-1">
                Mark for Follow-up
              </Button>
              <Button type="button" variant="outline" onClick={handleSkip} className="flex-1">
                Skip Apartment
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
