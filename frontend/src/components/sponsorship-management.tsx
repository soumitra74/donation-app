"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogOut, Plus, Edit, Trash2, ArrowLeft, Save, Users } from "lucide-react"
import { User, UserRole } from "@/services/auth"
import { sponsorshipsService, Sponsorship, CreateSponsorshipData, UpdateSponsorshipData } from "@/services/sponsorships"

interface SponsorshipManagementProps {
  user: User
  roles: UserRole[]
  onLogout: () => void
  onBack: () => void
  theme: 'light' | 'dark' | 'ambient'
}

interface CreateFormData {
  name: string
  amount: number
  max_count: number
  is_closed: boolean
}

interface EditFormData {
  name: string
  amount: number
  max_count: number
  is_closed: boolean
}

export function SponsorshipManagement({ roles, onLogout, onBack, theme }: SponsorshipManagementProps) {
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSponsorship, setEditingSponsorship] = useState<Sponsorship | null>(null)
  const [deletingSponsorship, setDeletingSponsorship] = useState<Sponsorship | null>(null)
  const [createForm, setCreateForm] = useState<CreateFormData>({
    name: '',
    amount: 0,
    max_count: 1,
    is_closed: false
  })
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    amount: 0,
    max_count: 1,
    is_closed: false
  })

  // Check if user is admin
  const isAdmin = roles.some(role => role.role === 'admin')

  useEffect(() => {
    if (isAdmin) {
      loadSponsorships()
    }
  }, [isAdmin])

  const loadSponsorships = async () => {
    try {
      setLoading(true)
      const sponsorshipsData = await sponsorshipsService.getSponsorships()
      setSponsorships(sponsorshipsData)
    } catch (error) {
      console.error('Failed to load sponsorships:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSponsorship = async () => {
    try {
      const createData: CreateSponsorshipData = {
        name: createForm.name,
        amount: createForm.amount,
        max_count: createForm.max_count
      }
      
      await sponsorshipsService.createSponsorship(createData)
      setShowCreateDialog(false)
      setCreateForm({ name: '', amount: 0, max_count: 1, is_closed: false })
      loadSponsorships()
    } catch (error) {
      console.error('Failed to create sponsorship:', error)
      alert('Failed to create sponsorship. Please try again.')
    }
  }

  const handleEditSponsorship = async () => {
    if (!editingSponsorship) return
    
    try {
      const updateData: UpdateSponsorshipData = {
        name: editForm.name,
        amount: editForm.amount,
        max_count: editForm.max_count
      }
      
      await sponsorshipsService.updateSponsorship(editingSponsorship.id, updateData)
      setEditingSponsorship(null)
      setEditForm({ name: '', amount: 0, max_count: 1, is_closed: false })
      loadSponsorships()
    } catch (error) {
      console.error('Failed to update sponsorship:', error)
      alert('Failed to update sponsorship. Please try again.')
    }
  }

  const handleDeleteSponsorship = async () => {
    if (!deletingSponsorship) return
    
    try {
      await sponsorshipsService.deleteSponsorship(deletingSponsorship.id)
      setDeletingSponsorship(null)
      loadSponsorships()
    } catch (error) {
      console.error('Failed to delete sponsorship:', error)
      alert('Failed to delete sponsorship. Please try again.')
    }
  }

  const openEditDialog = (sponsorship: Sponsorship) => {
    setEditingSponsorship(sponsorship)
    setEditForm({
      name: sponsorship.name,
      amount: sponsorship.amount,
      max_count: sponsorship.max_count,
      is_closed: sponsorship.is_closed
    })
  }

  const getCardClasses = () => {
    return theme === 'ambient' 
      ? 'bg-white/10 backdrop-blur-md border-white/20' 
      : theme === 'dark'
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white border-gray-200'
  }

  const getTextClasses = () => {
    return theme === 'ambient' 
      ? 'text-white' 
      : theme === 'dark'
      ? 'text-white'
      : 'text-gray-900'
  }

  const getSecondaryTextClasses = () => {
    return theme === 'ambient' 
      ? 'text-white/70' 
      : theme === 'dark'
      ? 'text-gray-400'
      : 'text-gray-600'
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className={`${
                  theme === 'ambient' 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                    : theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className={`text-2xl font-bold ${getTextClasses()}`}>
                  Sponsorship Management
                </h1>
                <p className={`text-sm ${getSecondaryTextClasses()}`}>
                  Manage sponsorship packages and availability
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className={`${
                  theme === 'ambient' 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                    : theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Create Sponsorship Button */}
        <div className="mb-6">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Sponsorship
          </Button>
        </div>

        {/* Sponsorships List */}
        <Card className={getCardClasses()}>
          <CardHeader>
            <CardTitle className={getTextClasses()}>
              Sponsorship Packages
            </CardTitle>
            <CardDescription className={getSecondaryTextClasses()}>
              Manage sponsorship packages and their availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : sponsorships.length === 0 ? (
              <p className={`text-center py-8 ${getSecondaryTextClasses()}`}>
                No sponsorships found. Create your first sponsorship package.
              </p>
            ) : (
              <div className="space-y-4">
                {sponsorships.map((sponsorship) => (
                  <div key={sponsorship.id} className={`flex items-center justify-between p-4 border rounded-lg ${
                    theme === 'ambient' 
                      ? 'bg-white/5 border-white/10' 
                      : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${getTextClasses()}`}>
                          {sponsorship.name}
                        </span>
                        <Badge variant="secondary" className="text-green-600">
                          ₹{sponsorship.amount.toLocaleString()}
                        </Badge>
                        {sponsorship.is_closed && (
                          <Badge variant="destructive">Closed</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`${getSecondaryTextClasses()}`}>
                          <Users className="h-3 w-3 inline mr-1" />
                          {sponsorship.booked}/{sponsorship.max_count} booked
                        </span>
                        <span className={`${getSecondaryTextClasses()}`}>
                          Created: {new Date(sponsorship.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(sponsorship)}
                        className={`${
                          theme === 'ambient' 
                            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                            : theme === 'dark'
                            ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingSponsorship(sponsorship)}
                        className={`${
                          theme === 'ambient' 
                            ? 'bg-white/10 border-white/20 text-red-400 hover:bg-red-500/20' 
                            : theme === 'dark'
                            ? 'bg-gray-600 border-gray-500 text-red-400 hover:bg-red-500/20'
                            : 'bg-white border-gray-300 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Sponsorship Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle className={getTextClasses()}>Create New Sponsorship</DialogTitle>
              <DialogDescription className={getSecondaryTextClasses()}>
                Add a new sponsorship package to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className={getTextClasses()}>Name</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Gold Sponsor, Silver Sponsor"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div>
                <Label htmlFor="amount" className={getTextClasses()}>Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: parseInt(e.target.value) || 0 })}
                  placeholder="10000"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div>
                <Label htmlFor="max_count" className={getTextClasses()}>Maximum Count</Label>
                <Input
                  id="max_count"
                  type="number"
                  value={createForm.max_count}
                  onChange={(e) => setCreateForm({ ...createForm, max_count: parseInt(e.target.value) || 1 })}
                  placeholder="5"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSponsorship} disabled={!createForm.name || createForm.amount <= 0}>
                <Save className="h-4 w-4 mr-2" />
                Create Sponsorship
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Sponsorship Dialog */}
        <Dialog open={!!editingSponsorship} onOpenChange={(open) => !open && setEditingSponsorship(null)}>
          <DialogContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle className={getTextClasses()}>Edit Sponsorship</DialogTitle>
              <DialogDescription className={getSecondaryTextClasses()}>
                Update sponsorship package details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className={getTextClasses()}>Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g., Gold Sponsor, Silver Sponsor"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div>
                <Label htmlFor="edit-amount" className={getTextClasses()}>Amount (₹)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: parseInt(e.target.value) || 0 })}
                  placeholder="10000"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div>
                <Label htmlFor="edit-max_count" className={getTextClasses()}>Maximum Count</Label>
                <Input
                  id="edit-max_count"
                  type="number"
                  value={editForm.max_count}
                  onChange={(e) => setEditForm({ ...editForm, max_count: parseInt(e.target.value) || 1 })}
                  placeholder="5"
                  className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSponsorship(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditSponsorship} disabled={!editForm.name || editForm.amount <= 0}>
                <Save className="h-4 w-4 mr-2" />
                Update Sponsorship
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingSponsorship} onOpenChange={(open) => !open && setDeletingSponsorship(null)}>
          <AlertDialogContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <AlertDialogHeader>
              <AlertDialogTitle className={getTextClasses()}>Delete Sponsorship</AlertDialogTitle>
              <AlertDialogDescription className={getSecondaryTextClasses()}>
                Are you sure you want to delete "{deletingSponsorship?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSponsorship} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
