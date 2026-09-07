import { describe, it, expect, vi } from 'vitest'
import {
  invalidateNavigationCache,
  normalizeMenuIcon,
  sortMenuItems,
  userMayReadTable,
  userMayRunAdministration,
} from '../../../server/services/navigation.service'

vi.mock('~~/server/utils/db', () => ({
  getDataSource: () => { throw new Error('no DB in unit tests') },
}))
vi.mock('~~/server/entities/global-table.entity', async () => await import('../../../server/entities/global-table.entity'))
vi.mock('~~/server/entities/administration.entity', async () => await import('../../../server/entities/administration.entity'))
vi.mock('~~/server/entities/user.entity', async () => await import('../../../server/entities/user.entity'))
vi.mock('~~/server/utils/url-matcher', async () => await import('../../../server/utils/url-matcher'))
vi.mock('~~/server/dto/navigation.dto', async () => await import('../../../server/dto/navigation.dto'))

function roleWithUrls(urls: string[], methods: string[] = ['GET']) {
  return {
    roleName: 'Test',
    permissions: [
      {
        permissionName: 'Test Perm',
        methods: methods.map((method) => ({ method })),
        urls: urls.map((url) => ({ url })),
      },
    ],
  }
}

describe('sortMenuItems', () => {
  it('orders by menuOrder ascending, nulls last', () => {
    const out = sortMenuItems([
      { label: 'B', order: null },
      { label: 'A', order: 2 },
      { label: 'C', order: 1 },
    ])
    expect(out.map((i) => i.label)).toEqual(['C', 'A', 'B'])
  })

  it('falls back to alphabetical labels on order collisions', () => {
    const out = sortMenuItems([
      { label: 'Zebra', order: 1 },
      { label: 'apel', order: 1 },
      { label: 'Mangga', order: 1 },
    ])
    expect(out.map((i) => i.label)).toEqual(['apel', 'Mangga', 'Zebra'])
  })

  it('sorts all-null orders alphabetically', () => {
    const out = sortMenuItems([
      { label: 'Pegawai', order: null },
      { label: 'Arsip', order: null },
    ])
    expect(out.map((i) => i.label)).toEqual(['Arsip', 'Pegawai'])
  })

  it('does not mutate the input array', () => {
    const input = [
      { label: 'B', order: 2 },
      { label: 'A', order: 1 },
    ]
    sortMenuItems(input)
    expect(input[0].label).toBe('B')
  })
})

describe('normalizeMenuIcon', () => {
  it('passes through allowlisted icons', () => {
    for (const icon of ['Table', 'Document', 'Folder', 'Star', 'Book', 'File']) {
      expect(normalizeMenuIcon(icon)).toBe(icon)
    }
  })

  it('falls back to null for unknown, null, and non-string icons', () => {
    expect(normalizeMenuIcon('Rocket')).toBeNull()
    expect(normalizeMenuIcon(null)).toBeNull()
    expect(normalizeMenuIcon(undefined)).toBeNull()
    expect(normalizeMenuIcon(42)).toBeNull()
  })
})

describe('userMayReadTable', () => {
  it('grants exact table URL readers', () => {
    const roles = [roleWithUrls(['/api/data/pegawai/*'])]
    expect(userMayReadTable(roles, 'pegawai')).toBe(true)
    expect(userMayReadTable(roles, 'arsip')).toBe(false)
  })

  it('grants broad wildcard readers', () => {
    const roles = [roleWithUrls(['/*'])]
    expect(userMayReadTable(roles, 'pegawai')).toBe(true)
  })

  it('denies when the grant is write-only (no GET)', () => {
    const roles = [roleWithUrls(['/api/data/pegawai/*'], ['POST', 'PUT', 'DELETE'])]
    expect(userMayReadTable(roles, 'pegawai')).toBe(false)
  })

  it('denies users with no roles', () => {
    expect(userMayReadTable([], 'pegawai')).toBe(false)
  })
})

describe('userMayRunAdministration', () => {
  it('grants named run permissions', () => {
    for (const name of ['Administration Run', 'Administration Management']) {
      const roles = [{ roleName: 'Operator', permissions: [{ permissionName: name }] }]
      expect(userMayRunAdministration(roles, 7)).toBe(true)
    }
  })

  it('grants POST on the nested start route', () => {
    const roles = [roleWithUrls(['/api/administrations/*/runs'], ['POST'])]
    expect(userMayRunAdministration(roles, 7)).toBe(true)
  })

  it('denies GET-only viewers (AC-003 analogue)', () => {
    const roles = [roleWithUrls(['/*'])]
    expect(userMayRunAdministration(roles, 7)).toBe(false)
  })

  it('denies users with no roles', () => {
    expect(userMayRunAdministration([], 7)).toBe(false)
  })
})

describe('invalidateNavigationCache', () => {
  it('is callable with and without a user id', () => {
    expect(() => invalidateNavigationCache()).not.toThrow()
    expect(() => invalidateNavigationCache(1)).not.toThrow()
  })
})
