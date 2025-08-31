"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, AlertTriangle, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { donationsService, CreateDonationData } from "@/services/donations"
import { sponsorshipsService, Sponsorship } from "@/services/sponsorships"
import { authService } from "@/services/auth"

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
  theme?: 'light' | 'dark' | 'ambient'
}

export function DonationForm({ onCancel, preselectedApartment, onDonationCreated, theme = 'light' }: DonationFormProps) {
  const [currentApartment, setCurrentApartment] = useState({
    tower: preselectedApartment?.tower || 1,
    floor: preselectedApartment?.floor || 1,
    unit: preselectedApartment?.unit || 1,
  })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionMessage, setTransitionMessage] = useState("")
  const [showQrPopup, setShowQrPopup] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([])
  const [loadingSponsorships, setLoadingSponsorships] = useState(false)
  const [showSkippedWarning, setShowSkippedWarning] = useState(false)
  const [skippedApartmentInfo, setSkippedApartmentInfo] = useState<{
    tower: number
    floor: number
    unit: number
    notes?: string
  } | null>(null)

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

  // Load sponsorships on component mount
  useEffect(() => {
    loadSponsorships()
  }, [])

  // Check apartment status when currentApartment changes
  useEffect(() => {
    checkApartmentStatus()
  }, [currentApartment])

  // Cleanup QR code URL when component unmounts or QR code changes
  useEffect(() => {
    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl)
      }
    }
  }, [qrCodeUrl])

  const checkApartmentStatus = async () => {
    try {
      const donation = await donationsService.getApartmentDonation(
        currentApartment.tower,
        currentApartment.floor,
        currentApartment.unit
      )
      
      if (donation && donation.status === 'skipped') {
        setSkippedApartmentInfo({
          tower: currentApartment.tower,
          floor: currentApartment.floor,
          unit: currentApartment.unit,
          notes: donation.notes
        })
        setShowSkippedWarning(true)
      } else {
        setShowSkippedWarning(false)
        setSkippedApartmentInfo(null)
      }
    } catch (error) {
      console.error('Failed to check apartment status:', error)
      // If there's an error, assume apartment is not skipped
      setShowSkippedWarning(false)
      setSkippedApartmentInfo(null)
    }
  }

  const loadSponsorships = async () => {
    setLoadingSponsorships(true)
    try {
      const availableSponsorships = await sponsorshipsService.getAvailableSponsorships()
      setSponsorships(availableSponsorships)
    } catch (error) {
      console.error('Failed to load sponsorships:', error)
    } finally {
      setLoadingSponsorships(false)
    }
  }

  const loadQrCode = async () => {
    setLoadingQr(true)
    try {
      const url = await authService.getQrCode()
      setQrCodeUrl(url)
    } catch (error) {
      console.error('Failed to load QR code:', error)
    } finally {
      setLoadingQr(false)
    }
  }

  const handlePaymentMethodChange = (method: "cash" | "upi-self" | "upi-other") => {
    handleInputChange("paymentMethod", method)
    
    if (method === "upi-self") {
      loadQrCode()
      setShowQrPopup(true)
    }
  }

  const [formData, setFormData] = useState({
    donorName: "",
    amount: "",
    phoneNumber: "",
    headCount: "",
    paymentMethod: "cash" as "cash" | "upi-self" | "upi-other",
    upiOtherPerson: "",
    sponsorship: "",
    sponsorshipId: "",
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

  const handleSponsorshipChange = (sponsorshipName: string) => {
    const selectedSponsorship = sponsorships.find(s => s.name === sponsorshipName)
    setFormData(prev => ({
      ...prev,
      sponsorship: sponsorshipName,
      sponsorshipId: selectedSponsorship ? selectedSponsorship.id.toString() : ""
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsTransitioning(true)
    setTransitionMessage("Recording donation...")

    try {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount")
      }

      // Validate sponsorship amount if sponsorship is selected
      if (formData.sponsorship && formData.sponsorshipId) {
        const selectedSponsorship = sponsorships.find(s => s.id.toString() === formData.sponsorshipId)
        if (selectedSponsorship && amount < parseFloat(selectedSponsorship.amount)) {
          throw new Error(`Donation amount (₹${amount}) must be greater than or equal to the sponsorship amount (₹${selectedSponsorship.amount})`)
        }
      }

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
        sponsorship_id: formData.sponsorshipId ? parseInt(formData.sponsorshipId) : undefined,
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
        sponsorshipId: "",
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

  const handleQrPopupClose = () => {
    setShowQrPopup(false)
    if (qrCodeUrl) {
      URL.revokeObjectURL(qrCodeUrl)
      setQrCodeUrl(null)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleQrPopupClose()
    }
  }

  const handleQrPopupDoubleClick = () => {
    handleQrPopupClose()
  }

  const donationAmount = Number.parseFloat(formData.amount) || 0

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

  const getHeaderClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-800 border-gray-700'
      case 'ambient':
        return 'bg-white/10 backdrop-blur-md border-white/20'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const getCardClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-800 border-gray-700'
      case 'ambient':
        return 'bg-white/10 backdrop-blur-md border-white/20'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const getTextClasses = () => {
    switch (theme) {
      case 'dark':
        return 'text-white'
      case 'ambient':
        return 'text-white'
      default:
        return 'text-gray-900'
    }
  }

  const getSubtextClasses = () => {
    switch (theme) {
      case 'dark':
        return 'text-gray-300'
      case 'ambient':
        return 'text-white/80'
      default:
        return 'text-gray-500'
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

      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 text-center shadow-xl ${getCardClasses()}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`font-medium ${getTextClasses()}`}>{transitionMessage}</p>
          </div>
        </div>
      )}

      {/* QR Code Popup */}
      {showQrPopup && (
        <div 
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleBackdropClick}
        >
          <div 
            className={`rounded-lg p-6 text-center shadow-xl max-w-sm mx-4 ${getCardClasses()}`}
            onDoubleClick={handleQrPopupDoubleClick}
          >
            <h3 className={`text-lg font-semibold mb-4 ${getTextClasses()}`}>Scan QR Code</h3>
            {loadingQr ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className={`ml-2 ${getTextClasses()}`}>Loading QR Code...</span>
              </div>
            ) : qrCodeUrl ? (
              <div className="space-y-4">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-48 h-48 mx-auto border-2 border-gray-300 rounded-lg"
                />
                <p className={`text-sm ${getSubtextClasses()}`}>
                  Double-click to close or click outside
                </p>
              </div>
            ) : (
              <div className="py-8">
                <p className={`text-red-500 ${getTextClasses()}`}>
                  No QR code found. Please upload one in your profile.
                </p>
                <Button 
                  onClick={handleQrPopupClose}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skipped Apartment Warning */}
      {showSkippedWarning && skippedApartmentInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className={`rounded-lg p-6 text-center shadow-xl max-w-sm mx-4 ${getCardClasses()}`}>
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 mr-2 text-red-500" />
              <span className={`font-semibold text-lg ${getTextClasses()}`}>Apartment Skipped!</span>
            </div>
            <p className={`text-sm mb-4 ${getSubtextClasses()}`}>
              Apartment <span className="font-semibold text-blue-600">{getFlatNumber()}</span> has already been marked as skipped.
              {skippedApartmentInfo.notes && (
                <span className="block mt-2 text-xs">
                  Reason: {skippedApartmentInfo.notes}
                </span>
              )}
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => {
                setShowSkippedWarning(false)
                setSkippedApartmentInfo(null)
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Continue Anyway
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto relative z-10">
        <div className={`border-b px-4 py-4 ${getHeaderClasses()}`}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={navigatePrevious} className="p-2">
              <ChevronLeft className={`h-5 w-5 ${getTextClasses()}`} />
            </Button>

            <div className="text-center">
              <div className={`text-2xl font-bold text-blue-600 ${theme === 'ambient' ? 'text-blue-400' : ''}`}>{getFlatNumber()}</div>
              <div className={`text-sm ${getSubtextClasses()}`}>
                Block {currentApartment.tower} • Floor {currentApartment.floor} • Unit {currentApartment.unit}
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={navigateNext} className="p-2">
              <ChevronRight className={`h-5 w-5 ${getTextClasses()}`} />
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Card className={getCardClasses()}>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Input
                    id="amount"
                    type="number"
                    min="100"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    required
                    placeholder="₹ Donation Amount"
                    className={`text-3xl h-16 text-center font-bold border-2 border-blue-200 focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' : 
                      theme === 'ambient' ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm placeholder-white/70' : 
                      'bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    disabled={isTransitioning}
                  />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={formData.paymentMethod === "cash" ? "default" : "outline"}
                      onClick={() => handlePaymentMethodChange("cash")}
                      className="h-12"
                      disabled={isTransitioning}
                    >
                      Cash
                    </Button>
                    <Button
                      type="button"
                      variant={formData.paymentMethod === "upi-self" ? "default" : "outline"}
                      onClick={() => handlePaymentMethodChange("upi-self")}
                      className="h-12"
                      disabled={isTransitioning}
                    >
                      UPI (self)
                    </Button>
                    <Button
                      type="button"
                      variant={formData.paymentMethod === "upi-other" ? "default" : "outline"}
                      onClick={() => handlePaymentMethodChange("upi-other")}
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
                      <SelectTrigger className={`h-12 ${
                        theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 
                        theme === 'ambient' ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm' : 
                        'bg-white text-gray-900'
                      }`}>
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
                    className={`h-12 ${
                      theme === 'dark' ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' : 
                      theme === 'ambient' ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm placeholder-white/70' : 
                      'bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    disabled={isTransitioning}
                  />
                </div>

                {donationAmount > 500 && (
                  <div className="space-y-3">
                    <Select
                      value={formData.sponsorship}
                      onValueChange={handleSponsorshipChange}
                      disabled={isTransitioning}
                    >
                      <SelectTrigger className={`h-12 ${
                        theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 
                        theme === 'ambient' ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm' : 
                        'bg-white text-gray-900'
                      }`}>
                        <SelectValue placeholder="Sponsorship" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingSponsorships ? (
                          <SelectItem value="">Loading sponsorships...</SelectItem>
                        ) : sponsorships.length === 0 ? (
                          <SelectItem value="">No sponsorships available</SelectItem>
                        ) : (
                          <>
                            <SelectItem value="">Select a sponsorship</SelectItem>
                            {sponsorships.map((sponsorship) => (
                              <SelectItem key={sponsorship.id} value={sponsorship.name}>
                                {sponsorship.name} (₹{sponsorship.amount})
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>

                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Notes"
                      className={`min-h-[80px] ${
                        theme === 'dark' ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' : 
                        theme === 'ambient' ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm placeholder-white/70' : 
                        'bg-white text-gray-900 placeholder-gray-500'
                      }`}
                      disabled={isTransitioning}
                    />
                  </div>
                )}

                <div className={`border-t pt-6 ${
                  theme === 'dark' ? 'border-gray-700' : 
                  theme === 'ambient' ? 'border-white/20' : 
                  'border-gray-200'
                }`}>
                  <div className="space-y-4">
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      placeholder="Phone Number"
                      className={`h-12 ${
                        theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 
                        theme === 'ambient' ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm' : 
                        'bg-white text-gray-900'
                      }`}
                      disabled={isTransitioning}
                    />

                    <Input
                      id="headCount"
                      type="number"
                      min="1"
                      value={formData.headCount}
                      onChange={(e) => handleInputChange("headCount", e.target.value)}
                      placeholder="Head Count"
                      className={`h-12 ${
                        theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 
                        theme === 'ambient' ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm' : 
                        'bg-white text-gray-900'
                      }`}
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
                    className="h-12 text-base bg-transparent"
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
