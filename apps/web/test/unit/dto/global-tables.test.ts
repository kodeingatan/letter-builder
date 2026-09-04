import { describe, it, expect } from 'vitest'
import {
  CreateGlobalTableSchema,
  UpdateGlobalTableSchema,
  GlobalTableQuerySchema,
  isReservedGlobalTableName,
} from '../../../server/dto/global-tables.dto'

describe('CreateGlobalTableSchema', () => {
  it('accepts a valid name and displayName', () => {
    const parsed = CreateGlobalTableSchema.safeParse({ name: 'pegawai', displayName: 'Pegawai' })
    expect(parsed.success).toBe(true)
  })

  it('rejects malformed names', () => {
    for (const name of ['Pegawai', '1pegawai', 'surat-tugas', 'surat tugas', '']) {
      expect(CreateGlobalTableSchema.safeParse({ name, displayName: 'X' }).success).toBe(false)
    }
  })

  it('rejects names longer than 64 chars', () => {
    expect(
      CreateGlobalTableSchema.safeParse({ name: 'a'.repeat(65), displayName: 'X' }).success,
    ).toBe(false)
  })

  it('requires displayName with max 100 chars', () => {
    expect(CreateGlobalTableSchema.safeParse({ name: 'pegawai' }).success).toBe(false)
    expect(
      CreateGlobalTableSchema.safeParse({ name: 'pegawai', displayName: 'x'.repeat(101) }).success,
    ).toBe(false)
  })
})

describe('UpdateGlobalTableSchema', () => {
  it('accepts displayName-only updates', () => {
    expect(UpdateGlobalTableSchema.safeParse({ displayName: 'New Name' }).success).toBe(true)
  })

  it('rejects name changes (immutable)', () => {
    expect(
      UpdateGlobalTableSchema.safeParse({ displayName: 'New Name', name: 'other' }).success,
    ).toBe(false)
  })
})

describe('GlobalTableQuerySchema', () => {
  it('applies pagination defaults', () => {
    const parsed = GlobalTableQuerySchema.safeParse({})
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.page).toBe(1)
      expect(parsed.data.limit).toBe(20)
      expect(parsed.data.sortBy).toBe('id')
      expect(parsed.data.sortOrder).toBe('DESC')
    }
  })
})

describe('isReservedGlobalTableName', () => {
  it('blocks system table names', () => {
    for (const name of ['users', 'roles', 'permissions', 'guards', 'settings', 'activity_logs', 'migrations']) {
      expect(isReservedGlobalTableName(name)).toBe(true)
    }
    expect(isReservedGlobalTableName('pegawai')).toBe(false)
  })
})
