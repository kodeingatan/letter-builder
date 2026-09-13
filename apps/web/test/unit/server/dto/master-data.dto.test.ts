import { describe, it, expect } from 'vitest'
import {
  CreateMasterTableSchema,
  UpdateMasterTableSchema,
  MasterColumnSchema,
  QueryMasterRowSchema,
} from '../../../../server/dto/master-data.dto'

const baseColumn = { name: 'nama', display_name: 'Nama' }

describe('master-data.dto — discriminated 13 types (FR-001, UT-03)', () => {
  it('accepts text without config', () => {
    expect(MasterColumnSchema.safeParse({ ...baseColumn, type: 'text' }).success).toBe(true)
  })

  it('requires options for select / select_multiple', () => {
    expect(MasterColumnSchema.safeParse({ ...baseColumn, type: 'select', config: { options: ['A'] } }).success).toBe(true)
    expect(MasterColumnSchema.safeParse({ ...baseColumn, type: 'select' }).success).toBe(false)
    expect(MasterColumnSchema.safeParse({ ...baseColumn, type: 'select_multiple', config: { options: [] } }).success).toBe(false)
  })

  it('requires target_slug for relations', () => {
    const ok = MasterColumnSchema.safeParse({ ...baseColumn, type: 'relation_single', config: { target_slug: 'jabatan' } })
    expect(ok.success).toBe(true)
    expect(MasterColumnSchema.safeParse({ ...baseColumn, type: 'relation_multiple', config: {} }).success).toBe(false)
  })

  it('requires expression for operation columns', () => {
    const ok = MasterColumnSchema.safeParse({
      ...baseColumn, type: 'readonly_operation_text', config: { expression: '"Total: "++gaji' },
    })
    expect(ok.success).toBe(true)
    expect(MasterColumnSchema.safeParse({ ...baseColumn, type: 'hidden_operation_text' }).success).toBe(false)
  })

  it('rejects unknown types (INV-002)', () => {
    expect(MasterColumnSchema.safeParse({ ...baseColumn, type: 'teleport' }).success).toBe(false)
  })

  it('rejects bad column names', () => {
    expect(MasterColumnSchema.safeParse({ name: '1x', display_name: 'X', type: 'text' }).success).toBe(false)
  })
})

describe('master-data.dto — table schemas (AC-001)', () => {
  const table = {
    name: 'pegawai',
    display_name: 'Pegawai',
    columns: [{ ...baseColumn, type: 'text', is_required: true }],
  }

  it('accepts a valid create payload (slug auto)', () => {
    const parsed = CreateMasterTableSchema.safeParse(table)
    expect(parsed.success).toBe(true)
  })

  it('requires ≥1 and ≤100 columns', () => {
    expect(CreateMasterTableSchema.safeParse({ ...table, columns: [] }).success).toBe(false)
  })

  it('accepts explicit valid slug, rejects bad slug', () => {
    expect(CreateMasterTableSchema.safeParse({ ...table, slug: 'pegawai_2024' }).success).toBe(true)
    expect(CreateMasterTableSchema.safeParse({ ...table, slug: 'MST-x' }).success).toBe(false)
    // slug-level blacklist lives in the DDL service (create rejects mst_/reserved at runtime)
  })

  it('update accepts partial fields + status enum', () => {
    expect(UpdateMasterTableSchema.safeParse({ status: 'ACTIVE' }).success).toBe(true)
    expect(UpdateMasterTableSchema.safeParse({ status: 'DELETED' }).success).toBe(false)
  })

  it('row query coerces pagination', () => {
    const parsed = QueryMasterRowSchema.safeParse({ page: '2', limit: '10', search: 'afd' })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.page).toBe(2)
      expect(parsed.data.sortBy).toBe('id')
    }
  })
})
