import { describe, it, expect } from 'vitest'
import {
  formatUserDisplayName,
  getUserInitials,
  filterUsersByRole,
  findUserByEmail,
  findUserByUsername,
  sortUsersByName,
} from '../../../app/composables/useUsersData'
import type { User } from '../../../shared/types/user'

const mockUsers: User[] = [
  {
    id: 1,
    firstName: 'Alice',
    lastName: 'Smith',
    username: 'alice',
    email: 'alice@test.com',
    roles: [{ id: 1, roleName: 'Admin', description: null, guards: [], permissions: [], createdAt: '', updatedAt: '' }],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    firstName: 'Bob',
    lastName: 'Jones',
    username: 'bob',
    email: 'bob@test.com',
    roles: [{ id: 2, roleName: 'User', description: null, guards: [], permissions: [], createdAt: '', updatedAt: '' }],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 3,
    firstName: 'Charlie',
    lastName: 'Admin',
    username: 'charlie',
    email: 'charlie@test.com',
    roles: [{ id: 1, roleName: 'Admin', description: null, guards: [], permissions: [], createdAt: '', updatedAt: '' }],
    createdAt: '',
    updatedAt: '',
  },
]

describe('formatUserDisplayName', () => {
  it('combines first and last name', () => {
    expect(formatUserDisplayName(mockUsers[0])).toBe('Alice Smith')
  })
})

describe('getUserInitials', () => {
  it('returns first letters of first and last name', () => {
    expect(getUserInitials(mockUsers[0])).toBe('AS')
  })
})

describe('filterUsersByRole', () => {
  it('filters users by role name', () => {
    const admins = filterUsersByRole(mockUsers, 'Admin')
    expect(admins).toHaveLength(2)
    expect(admins.map((u) => u.username)).toEqual(['alice', 'charlie'])
  })

  it('returns empty array for non-matching role', () => {
    expect(filterUsersByRole(mockUsers, 'SuperAdmin')).toHaveLength(0)
  })
})

describe('findUserByEmail', () => {
  it('finds user by email', () => {
    expect(findUserByEmail(mockUsers, 'bob@test.com')?.id).toBe(2)
  })

  it('returns undefined for non-existent email', () => {
    expect(findUserByEmail(mockUsers, 'none@test.com')).toBeUndefined()
  })
})

describe('findUserByUsername', () => {
  it('finds user by username', () => {
    expect(findUserByUsername(mockUsers, 'alice')?.id).toBe(1)
  })

  it('returns undefined for non-existent username', () => {
    expect(findUserByUsername(mockUsers, 'nobody')).toBeUndefined()
  })
})

describe('sortUsersByName', () => {
  it('sorts users alphabetically by first name', () => {
    const sorted = sortUsersByName(mockUsers)
    expect(sorted.map((u) => u.firstName)).toEqual(['Alice', 'Bob', 'Charlie'])
  })
})
