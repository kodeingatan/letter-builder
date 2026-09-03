import { describe, it, expect } from 'vitest'
import {
  formatRoleDisplayName,
  findRoleByName,
  findRoleById,
  filterRolesWithPermissions,
  sortRolesByName,
} from '../../../app/composables/useRolesData'
import type { Role } from '../../../shared/types/role'

const mockRoles: Role[] = [
  {
    id: 1,
    roleName: 'Admin',
    description: 'Full access',
    guards: [],
    permissions: [{ id: 1, permissionName: 'users.manage', description: null, methods: [], urls: [], createdAt: '', updatedAt: '' }],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    roleName: 'User',
    description: 'Basic access',
    guards: [],
    permissions: [],
    createdAt: '',
    updatedAt: '',
  },
]

describe('formatRoleDisplayName', () => {
  it('returns role name', () => {
    expect(formatRoleDisplayName(mockRoles[0])).toBe('Admin')
  })
})

describe('findRoleByName', () => {
  it('finds role by name', () => {
    expect(findRoleByName(mockRoles, 'Admin')?.id).toBe(1)
  })

  it('returns undefined for non-existent name', () => {
    expect(findRoleByName(mockRoles, 'SuperAdmin')).toBeUndefined()
  })
})

describe('findRoleById', () => {
  it('finds role by id', () => {
    expect(findRoleById(mockRoles, 2)?.roleName).toBe('User')
  })

  it('returns undefined for non-existent id', () => {
    expect(findRoleById(mockRoles, 99)).toBeUndefined()
  })
})

describe('filterRolesWithPermissions', () => {
  it('filters roles that have permissions', () => {
    const result = filterRolesWithPermissions(mockRoles)
    expect(result).toHaveLength(1)
    expect(result[0].roleName).toBe('Admin')
  })
})

describe('sortRolesByName', () => {
  it('sorts roles alphabetically', () => {
    const sorted = sortRolesByName(mockRoles)
    expect(sorted.map((r) => r.roleName)).toEqual(['Admin', 'User'])
  })
})
