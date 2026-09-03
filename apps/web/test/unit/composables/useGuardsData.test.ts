import { describe, it, expect } from 'vitest'
import {
  formatGuardDisplayName,
  findGuardByName,
  findGuardById,
  filterGuardsByType,
  sortGuardsByName,
} from '../../../app/composables/useGuardsData'
import type { Guard } from '../../../shared/types/guard'

const mockGuards: Guard[] = [
  {
    id: 1,
    guardName: 'AdminGuard',
    description: 'Admin guard',
    urls: [
      { id: 1, url: '/api/users', type: 'allow' },
      { id: 2, url: '/api/admin/*', type: 'deny' },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    guardName: 'UserGuard',
    description: 'User guard',
    urls: [
      { id: 3, url: '/api/profile', type: 'allow' },
    ],
    createdAt: '',
    updatedAt: '',
  },
]

describe('formatGuardDisplayName', () => {
  it('returns guard name', () => {
    expect(formatGuardDisplayName(mockGuards[0])).toBe('AdminGuard')
  })
})

describe('findGuardByName', () => {
  it('finds guard by name', () => {
    expect(findGuardByName(mockGuards, 'UserGuard')?.id).toBe(2)
  })

  it('returns undefined for non-existent name', () => {
    expect(findGuardByName(mockGuards, 'Nonexistent')).toBeUndefined()
  })
})

describe('findGuardById', () => {
  it('finds guard by id', () => {
    expect(findGuardById(mockGuards, 1)?.guardName).toBe('AdminGuard')
  })

  it('returns undefined for non-existent id', () => {
    expect(findGuardById(mockGuards, 99)).toBeUndefined()
  })
})

describe('filterGuardsByType', () => {
  it('filters guards that have deny URLs', () => {
    const denyGuards = filterGuardsByType(mockGuards, 'deny')
    expect(denyGuards).toHaveLength(1)
    expect(denyGuards[0].guardName).toBe('AdminGuard')
  })

  it('filters guards that have allow URLs', () => {
    const allowGuards = filterGuardsByType(mockGuards, 'allow')
    expect(allowGuards).toHaveLength(2)
  })
})

describe('sortGuardsByName', () => {
  it('sorts guards alphabetically', () => {
    const sorted = sortGuardsByName([...mockGuards].reverse())
    expect(sorted.map((g) => g.guardName)).toEqual(['AdminGuard', 'UserGuard'])
  })
})
