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
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionMessage, setTransitionMessage] = useState("")

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

    setTransitionMessage("Recording donation...")
    setIsTransitioning(true)
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
    setIsTransitioning(false)
    setTransitionMessage("")
  }

  const handleSkip = async () => {
    setTransitionMessage("Skipping apartment...")
    setIsTransitioning(true)
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
    setIsTransitioning(false)
    setTransitionMessage("")
  }

  const handleFollowUp = async () => {
    setTransitionMessage("Marking for follow-up...")
    setIsTransitioning(true)
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
    setIsTransitioning(false)
    setTransitionMessage("")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const donationAmount = Number.parseFloat(formData.amount) || 0

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">{transitionMessage}</p>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto">
        <div className="bg-white border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={navigatePrevious} className="p-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getFlatNumber()}</div>
              <div className="text-sm text-gray-500">
                Block {currentApartment.tower} • Floor {currentApartment.floor} • Unit {currentApartment.unit}
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={navigateNext} className="p-2">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    required
                    placeholder="₹ Donation Amount"
                    className="text-3xl h-16 text-center font-bold border-2 border-blue-200 focus:border-blue-500"
                    disabled={isTransitioning}
                  />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={formData.paymentMethod === "cash" ? "default" : "outline"}
                      onClick={() => handleInputChange("paymentMethod", "cash")}
                      className="h-12"
                      disabled={isTransitioning}
                    >
                      Cash
                    </Button>
                    <Button
                      type="button"
                      variant={formData.paymentMethod === "upi-self" ? "default" : "outline"}
                      onClick={() => handleInputChange("paymentMethod", "upi-self")}
                      className="h-12"
                      disabled={isTransitioning}
                    >
                      UPI (self)
                    </Button>
                    <Button
                      type="button"
                      variant={formData.paymentMethod === "upi-other" ? "default" : "outline"}
                      onClick={() => handleInputChange("paymentMethod", "upi-other")}
                      className="h-12"
                      disabled={isTransitioning}
                    >
                      UPI (other)
                    </Button>
                  </div>

                  {formData.paymentMethod === "upi-other" && (
                    <Select
                      value={formData.upiOtherPerson}
                      onValueChange={(value) => handleInputChange("upiOtherPerson", value)}
                      disabled={isTransitioning}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select UPI person" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Surojeet">Surojeet</SelectItem>
                        <SelectItem value="Pramit">Pramit</SelectItem>
                        <SelectItem value="Abhijit Banerjee">Abhijit Banerjee</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-3">
                  <Input
                    id="donorName"
                    type="text"
                    value={formData.donorName}
                    onChange={(e) => handleInputChange("donorName", e.target.value)}
                    required
                    placeholder="Donor Name"
                    className="h-12"
                    disabled={isTransitioning}
                  />
                </div>

                {donationAmount > 500 && (
                  <div className="space-y-3">
                    <Select
                      value={formData.sponsorship}
                      onValueChange={(value) => handleInputChange("sponsorship", value)}
                      disabled={isTransitioning}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Sponsorship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NA">Select</SelectItem>
                        <SelectItem value="Flowers">Flowers</SelectItem>
                        <SelectItem value="Sweets">Sweets</SelectItem>
                        <SelectItem value="Decoration">Decoration</SelectItem>
                      </SelectContent>
                    </Select>

                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Notes"
                      className="min-h-[80px]"
                      disabled={isTransitioning}
                    />
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6">
                  <div className="space-y-4">
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      placeholder="Phone Number"
                      className="h-12"
                      disabled={isTransitioning}
                    />

                    <Input
                      id="headCount"
                      type="number"
                      min="1"
                      value={formData.headCount}
                      onChange={(e) => handleInputChange("headCount", e.target.value)}
                      placeholder="Head Count"
                      className="h-12"
                      disabled={isTransitioning}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    type="submit"
                    className="h-12 bg-blue-600 hover:bg-blue-700 text-base font-medium"
                    disabled={!formData.donorName || !formData.amount || isTransitioning}
                  >
                    {isTransitioning ? "Recording..." : "Record Donation"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 text-base bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    onClick={handleFollowUp}
                    disabled={isTransitioning}
                  >
                    {isTransitioning ? "Saving..." : "Follow up"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSkip} 
                    className="h-12 text-base bg-transparent"
                    disabled={isTransitioning}
                  >
                    Skip
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel} 
                    className="h-12 text-base bg-transparent"
                    disabled={isTransitioning}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
