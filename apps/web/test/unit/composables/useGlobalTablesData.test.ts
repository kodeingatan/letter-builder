import { describe, it, expect } from 'vitest'
import {
  isValidGlobalTableName,
  isReservedGlobalTableName,
  formatGlobalTableDisplayName,
  findGlobalTableByName,
  findGlobalTableById,
  sortGlobalTablesByName,
} from '../../../app/composables/useGlobalTablesData'
import type { GlobalTable } from '../../../shared/types/global-table'

const mockTables: GlobalTable[] = [
  { id: 1, name: 'pegawai', displayName: 'Pegawai', createdAt: '', updatedAt: '' },
  { id: 2, name: 'surat_tugas', displayName: '', createdAt: '', updatedAt: '' },
]

describe('isValidGlobalTableName', () => {
  it('accepts valid snake_case names', () => {
    expect(isValidGlobalTableName('pegawai')).toBe(true)
    expect(isValidGlobalTableName('surat_tugas')).toBe(true)
    expect(isValidGlobalTableName('a1_b2')).toBe(true)
  })

  it('rejects names starting with number or uppercase', () => {
    expect(isValidGlobalTableName('1pegawai')).toBe(false)
    expect(isValidGlobalTableName('Pegawai')).toBe(false)
    expect(isValidGlobalTableName('surat-tugas')).toBe(false)
    expect(isValidGlobalTableName('')).toBe(false)
  })

  it('rejects names longer than 64 chars', () => {
    expect(isValidGlobalTableName('a'.repeat(65))).toBe(false)
    expect(isValidGlobalTableName('a'.repeat(64))).toBe(true)
  })
})

describe('isReservedGlobalTableName', () => {
  it('detects reserved names case-insensitively', () => {
    expect(isReservedGlobalTableName('users')).toBe(true)
    expect(isReservedGlobalTableName('USERS')).toBe(true)
    expect(isReservedGlobalTableName('activity_logs')).toBe(true)
    expect(isReservedGlobalTableName('pegawai')).toBe(false)
  })
})

describe('formatGlobalTableDisplayName', () => {
  it('prefers displayName, falls back to name', () => {
    expect(formatGlobalTableDisplayName(mockTables[0])).toBe('Pegawai')
    expect(formatGlobalTableDisplayName(mockTables[1])).toBe('surat_tugas')
  })
})

describe('findGlobalTableByName', () => {
  it('finds table case-insensitively', () => {
    expect(findGlobalTableByName(mockTables, 'PEGAWAI')?.id).toBe(1)
  })

  it('returns undefined for unknown name', () => {
    expect(findGlobalTableByName(mockTables, 'unknown')).toBeUndefined()
  })
})

describe('findGlobalTableById', () => {
  it('finds table by id', () => {
    expect(findGlobalTableById(mockTables, 2)?.name).toBe('surat_tugas')
  })

  it('returns undefined for unknown id', () => {
    expect(findGlobalTableById(mockTables, 99)).toBeUndefined()
  })
})

describe('sortGlobalTablesByName', () => {
  it('sorts alphabetically', () => {
    expect(sortGlobalTablesByName(mockTables).map((t) => t.name)).toEqual(['pegawai', 'surat_tugas'])
  })
})
