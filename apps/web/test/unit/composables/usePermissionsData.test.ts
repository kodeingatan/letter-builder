import { describe, it, expect } from 'vitest'
import {
  formatPermissionDisplayName,
  findPermissionByName,
  filterPermissionsByMethod,
  filterPermissionsByUrl,
  sortPermissionsByName,
} from '../../../app/composables/usePermissionsData'
import type { Permission } from '../../../shared/types/permission'

const mockPermissions: Permission[] = [
  {
    id: 1,
    permissionName: 'users.read',
    description: 'Read users',
    methods: [{ id: 1, method: 'GET' }],
    urls: [{ id: 1, url: '/api/users' }],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    permissionName: 'users.write',
    description: 'Write users',
    methods: [{ id: 2, method: 'POST' }, { id: 3, method: 'PUT' }],
    urls: [{ id: 2, url: '/api/users' }],
    createdAt: '',
    updatedAt: '',
  },
]

describe('formatPermissionDisplayName', () => {
  it('returns permission name', () => {
    expect(formatPermissionDisplayName(mockPermissions[0])).toBe('users.read')
  })
})

describe('findPermissionByName', () => {
  it('finds permission by name', () => {
    expect(findPermissionByName(mockPermissions, 'users.write')?.id).toBe(2)
  })

  it('returns undefined for non-existent name', () => {
    expect(findPermissionByName(mockPermissions, 'nonexistent')).toBeUndefined()
  })
})

describe('filterPermissionsByMethod', () => {
  it('filters permissions by HTTP method', () => {
    const getPerms = filterPermissionsByMethod(mockPermissions, 'GET')
    expect(getPerms).toHaveLength(1)
    expect(getPerms[0].permissionName).toBe('users.read')
  })

  it('returns multiple matches', () => {
    const writePerms = filterPermissionsByMethod(mockPermissions, 'POST')
    expect(writePerms).toHaveLength(1)
  })
})

describe('filterPermissionsByUrl', () => {
  it('filters permissions by URL', () => {
    const userPerms = filterPermissionsByUrl(mockPermissions, '/api/users')
    expect(userPerms).toHaveLength(2)
  })

  it('returns empty for non-matching URL', () => {
    expect(filterPermissionsByUrl(mockPermissions, '/api/roles')).toHaveLength(0)
  })
})

describe('sortPermissionsByName', () => {
  it('sorts permissions alphabetically', () => {
    const sorted = sortPermissionsByName([...mockPermissions].reverse())
    expect(sorted.map((p) => p.permissionName)).toEqual(['users.read', 'users.write'])
  })
})
