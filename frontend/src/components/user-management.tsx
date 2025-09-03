"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogOut, Plus, Edit, Trash2, ArrowLeft, Save } from "lucide-react"
import { User, UserRole } from "@/services/auth"
import { authService } from "@/services/auth"

interface UserManagementProps {
  user: User
  roles: UserRole[]
  onLogout: () => void
  onBack: () => void
  theme: 'light' | 'dark' | 'ambient'
}

interface UserWithRoles extends User {
  user_roles: UserRole[]
}

interface CreateUserData {
  email: string
  name: string
  password: string
  role: string
  assigned_towers: number[]
}

interface EditUserData {
  email: string
  name: string
  role: string
  assigned_towers: number[]
}

export function UserManagement({ user, roles, onLogout, onBack, theme }: UserManagementProps) {
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserWithRoles | null>(null)
  const [createForm, setCreateForm] = useState<CreateUserData>({
    email: '',
    name: '',
    password: '',
    role: 'collector',
    assigned_towers: []
  })
  const [editForm, setEditForm] = useState<EditUserData>({
    email: '',
    name: '',
    role: 'collector',
    assigned_towers: []
  })

  // Check if user is admin
  const isAdmin = roles.some(role => role.role === 'admin')

  // Available towers
  const availableTowers = [1, 2, 3, 4, 5, 6, 7, 8, 10]

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await authService.getUsers()
      // Transform the data to match the expected interface
      const transformedUsers = usersData.map((user: any) => ({
        ...user,
        user_roles: (user.user_roles || []).map((role: any) => ({
          ...role,
          assigned_towers: typeof role.assigned_towers === 'string' 
            ? JSON.parse(role.assigned_towers || '[]')
            : (role.assigned_towers || [])
        }))
      }))
      setUsers(transformedUsers)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      await authService.createUser(createForm)
      setShowCreateDialog(false)
      setCreateForm({
        email: '',
        name: '',
        password: '',
        role: 'collector',
        assigned_towers: []
      })
      loadUsers()
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return
    
    try {
      await authService.updateUser(editingUser.id, editForm)
      setEditingUser(null)
      setEditForm({
        email: '',
        name: '',
        role: 'collector',
        assigned_towers: []
      })
      loadUsers()
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    
    try {
      await authService.deleteUser(deletingUser.id)
      setDeletingUser(null)
      loadUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const openEditDialog = (user: UserWithRoles) => {
    setEditingUser(user)
    const userRole = user.user_roles[0]
    const rawAssignedTowers = userRole?.assigned_towers
    const assignedTowers = rawAssignedTowers
      ? (typeof rawAssignedTowers === 'string' 
          ? JSON.parse(rawAssignedTowers || '[]')
          : rawAssignedTowers)
      : []
    
    setEditForm({
      email: user.email,
      name: user.name,
      role: userRole?.role || 'collector',
      assigned_towers: assignedTowers
    })
  }

  const toggleTowerAssignment = (tower: number, isCreate: boolean = true) => {
    if (isCreate) {
      setCreateForm(prev => ({
        ...prev,
        assigned_towers: prev.assigned_towers.includes(tower)
          ? prev.assigned_towers.filter(t => t !== tower)
          : [...prev.assigned_towers, tower]
      }))
    } else {
      setEditForm(prev => ({
        ...prev,
        assigned_towers: prev.assigned_towers.includes(tower)
          ? prev.assigned_towers.filter(t => t !== tower)
          : [...prev.assigned_towers, tower]
      }))
    }
  }

  if (!isAdmin) {
    return (
      <div className={`min-h-screen ${theme === 'ambient' ? 'bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900' : theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 py-8">
          <Card className={`max-w-md mx-auto ${theme === 'ambient' ? 'bg-white/10 backdrop-blur-md border-white/20' : theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
              <p className={`text-center ${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Access denied. Admin privileges required.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'ambient' ? 'bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900' : theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`border-b ${theme === 'ambient' ? 'bg-white/10 backdrop-blur-md border-white/20' : theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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
                <h1 className={`text-2xl font-bold ${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  User Management
                </h1>
                <p className={`text-sm ${theme === 'ambient' ? 'text-white/70' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage users and their roles
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
        {/* Create User Button */}
        <div className="mb-6">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className={`${theme === 'ambient' ? 'bg-white/10 backdrop-blur-md border-white/20' : theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <DialogHeader>
                <DialogTitle className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Create New User
                </DialogTitle>
                <DialogDescription className={`${theme === 'ambient' ? 'text-white/70' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Add a new user to the system with appropriate roles and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`${theme === 'ambient' ? 'bg-white/20 border-white/30 text-white placeholder-white/50' : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="name" className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Name</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    className={`${theme === 'ambient' ? 'bg-white/20 border-white/30 text-white placeholder-white/50' : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="password" className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    className={`${theme === 'ambient' ? 'bg-white/20 border-white/30 text-white placeholder-white/50' : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="role" className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Role</Label>
                  <Select value={createForm.role} onValueChange={(value) => setCreateForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className={`${theme === 'ambient' ? 'bg-white/20 border-white/30 text-white' : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collector">Collector</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Assigned Towers</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {availableTowers.map(tower => (
                      <div key={tower} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tower-${tower}`}
                          checked={createForm.assigned_towers.includes(tower)}
                          onCheckedChange={() => toggleTowerAssignment(tower, true)}
                        />
                        <Label htmlFor={`tower-${tower}`} className={`text-sm ${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Tower {tower}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser}>
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users List */}
        <Card className={`${theme === 'ambient' ? 'bg-white/10 backdrop-blur-md border-white/20' : theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Users ({users.length})
            </CardTitle>
            <CardDescription className={`${theme === 'ambient' ? 'text-white/70' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : users.length === 0 ? (
              <p className={`text-center py-8 ${theme === 'ambient' ? 'text-white/60' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                No users found. Create the first user above.
              </p>
            ) : (
              <div className="space-y-4">
                {users.map((userItem) => (
                  <div key={userItem.id} className={`flex items-center justify-between p-4 border rounded-lg ${
                    theme === 'ambient' 
                      ? 'bg-white/5 border-white/10' 
                      : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {userItem.name}
                        </span>
                        <Badge variant="secondary">
                          {userItem.user_roles[0]?.role || 'No Role'}
                        </Badge>
                        {userItem.id === user.id && (
                          <Badge variant="outline" className="text-xs">
                            Current User
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${theme === 'ambient' ? 'text-white/70' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {userItem.email}
                      </p>
                                             {userItem.user_roles[0]?.assigned_towers && (
                         (() => {
                           const towers = userItem.user_roles[0].assigned_towers
                           const towerArray = Array.isArray(towers) ? towers : 
                             (typeof towers === 'string' ? JSON.parse(towers || '[]') : [])
                           return towerArray.length > 0 ? (
                             <p className={`text-xs ${theme === 'ambient' ? 'text-white/50' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                               Towers: {towerArray.join(', ')}
                             </p>
                           ) : null
                         })()
                       )}
                    </div>
                                         <div className="flex items-center gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => openEditDialog(userItem)}
                         disabled={userItem.id === user.id}
                       >
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setDeletingUser(userItem)}
                         disabled={userItem.id === user.id}
                         className="text-red-600 hover:text-red-700"
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

         {/* Delete User Alert Dialog */}
         {deletingUser && (
           <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
             <AlertDialogContent className={`${theme === 'ambient' ? 'bg-white/10 backdrop-blur-md border-white/20' : theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
               <AlertDialogHeader>
                 <AlertDialogTitle className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                   Delete User
                 </AlertDialogTitle>
                 <AlertDialogDescription className={`${theme === 'ambient' ? 'text-white/70' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                   Are you sure you want to delete {deletingUser?.name}? This action cannot be undone.
                 </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                 <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                   Delete
                 </AlertDialogAction>
               </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
         )}

         {/* Edit User Dialog */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent className={`${theme === 'ambient' ? 'bg-white/10 backdrop-blur-md border-white/20' : theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <DialogHeader>
                <DialogTitle className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Edit User: {editingUser.name}
                </DialogTitle>
                <DialogDescription className={`${theme === 'ambient' ? 'text-white/70' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Update user information and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-email" className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`${theme === 'ambient' ? 'bg-white/20 border-white/30 text-white placeholder-white/50' : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-name" className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className={`${theme === 'ambient' ? 'bg-white/20 border-white/30 text-white placeholder-white/50' : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role" className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Role</Label>
                  <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className={`${theme === 'ambient' ? 'bg-white/20 border-white/30 text-white' : theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collector">Collector</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={`${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Assigned Towers</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {availableTowers.map(tower => (
                      <div key={tower} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-tower-${tower}`}
                          checked={editForm.assigned_towers.includes(tower)}
                          onCheckedChange={() => toggleTowerAssignment(tower, false)}
                        />
                        <Label htmlFor={`edit-tower-${tower}`} className={`text-sm ${theme === 'ambient' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Tower {tower}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditUser}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
