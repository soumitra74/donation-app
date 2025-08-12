"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Donation {
  donorName: string
  amount: number
  tower: number
  floor: number
  unit: number
  phoneNumber?: string
  headCount?: number
  paymentMethod: "cash" | "upi-self" | "upi-other"
  upiOtherPerson?: string
  sponsorship?: string
  notes?: string
}

interface DonationFormProps {
  onSubmit: (donation: Donation) => void
  onCancel: () => void
}

export function DonationForm({ onSubmit, onCancel }: DonationFormProps) {
  const [currentApartment, setCurrentApartment] = useState({
    tower: 1,
    floor: 1,
    unit: 1,
  })

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
    const towerLetter = String.fromCharCode(65 + currentApartment.tower - 1) // A, B, C, etc.
    const floorUnit = `${currentApartment.floor.toString().padStart(2, "0")}${currentApartment.unit}`
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const donation: Donation = {
      donorName: formData.donorName.trim(),
      amount: Number.parseFloat(formData.amount),
      tower: currentApartment.tower,
      floor: currentApartment.floor,
      unit: currentApartment.unit,
      phoneNumber: formData.phoneNumber.trim() || undefined,
      headCount: formData.headCount ? Number.parseInt(formData.headCount) : undefined,
      paymentMethod: formData.paymentMethod,
      upiOtherPerson: formData.paymentMethod === "upi-other" ? formData.upiOtherPerson : undefined,
      sponsorship: formData.sponsorship || undefined,
      notes: formData.notes.trim() || undefined,
    }

    onSubmit(donation)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const donationAmount = Number.parseFloat(formData.amount) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={navigatePrevious} className="p-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getFlatNumber()}</div>
              <div className="text-sm text-gray-500">
                Tower {currentApartment.tower} • Floor {currentApartment.floor} • Unit {currentApartment.unit}
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
                  />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={formData.paymentMethod === "cash" ? "default" : "outline"}
                      onClick={() => handleInputChange("paymentMethod", "cash")}
                      className="h-12"
                    >
                      Cash
                    </Button>
                    <Button
                      type="button"
                      variant={formData.paymentMethod === "upi-self" ? "default" : "outline"}
                      onClick={() => handleInputChange("paymentMethod", "upi-self")}
                      className="h-12"
                    >
                      UPI (self)
                    </Button>
                    <Button
                      type="button"
                      variant={formData.paymentMethod === "upi-other" ? "default" : "outline"}
                      onClick={() => handleInputChange("paymentMethod", "upi-other")}
                      className="h-12"
                    >
                      UPI (other)
                    </Button>
                  </div>

                  {formData.paymentMethod === "upi-other" && (
                    <Select
                      value={formData.upiOtherPerson}
                      onValueChange={(value) => handleInputChange("upiOtherPerson", value)}
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
                  />
                </div>

                {donationAmount > 500 && (
                  <div className="space-y-3">
                    <Select
                      value={formData.sponsorship}
                      onValueChange={(value) => handleInputChange("sponsorship", value)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Sponsorship" />
                      </SelectTrigger>
                      <SelectContent>
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
                    />

                    <Input
                      id="headCount"
                      type="number"
                      min="1"
                      value={formData.headCount}
                      onChange={(e) => handleInputChange("headCount", e.target.value)}
                      placeholder="Head Count"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    type="submit"
                    className="h-12 bg-blue-600 hover:bg-blue-700 text-base font-medium"
                    disabled={!formData.donorName || !formData.amount}
                  >
                    Record Donation
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 text-base bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    disabled={!formData.donorName || !formData.amount}
                    onClick={() => {
                      // Handle follow up logic - could mark apartment for follow up
                      console.log("Follow up clicked for apartment:", getFlatNumber())
                      // You can add follow up logic here
                    }}
                  >
                    Follow up
                  </Button>
                  <Button type="button" variant="outline" onClick={onCancel} className="h-12 text-base bg-transparent">
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
