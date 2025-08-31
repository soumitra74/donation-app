import { test, expect } from '@playwright/test'
import { authService } from '../src/services/auth'

test.describe('Admin Functionality', () => {
  test('should correctly identify admin users', () => {
    const adminRoles = [
      { role: 'admin', assigned_towers: [] },
      { role: 'collector', assigned_towers: [1, 2] }
    ]
    
    const collectorRoles = [
      { role: 'collector', assigned_towers: [1, 2] }
    ]
    
    // Test admin role detection
    expect(authService.hasRole(adminRoles, 'admin')).toBe(true)
    expect(authService.hasRole(collectorRoles, 'admin')).toBe(false)
    
    // Test tower access for admin
    expect(authService.canAccessTower(adminRoles, 1)).toBe(true)
    expect(authService.canAccessTower(adminRoles, 999)).toBe(true) // Admin can access any tower
    
    // Test tower access for collector
    expect(authService.canAccessTower(collectorRoles, 1)).toBe(true)
    expect(authService.canAccessTower(collectorRoles, 2)).toBe(true)
    expect(authService.canAccessTower(collectorRoles, 999)).toBe(false) // Collector can't access unassigned tower
  })

  test('should handle empty roles array', () => {
    const emptyRoles: any[] = []
    
    expect(authService.hasRole(emptyRoles, 'admin')).toBe(false)
    expect(authService.canAccessTower(emptyRoles, 1)).toBe(false)
  })

  test('should handle multiple roles for same user', () => {
    const multiRoles = [
      { role: 'collector', assigned_towers: [1, 2] },
      { role: 'admin', assigned_towers: [] }
    ]
    
    expect(authService.hasRole(multiRoles, 'admin')).toBe(true)
    expect(authService.hasRole(multiRoles, 'collector')).toBe(true)
    expect(authService.canAccessTower(multiRoles, 999)).toBe(true) // Admin role gives access to all towers
  })
})
