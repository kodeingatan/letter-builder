import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateRowValues,
  stripComputedInputs,
  coerceCsvCell,
  isComputedType,
} from '../../../server/utils/dynamic-schema'
import { TableDataService } from '../../../server/services/table-data.service'
import { GlobalTableSchema } from '../../../server/entities/global-table.entity'
import { GlobalTableColumnSchema } from '../../../server/entities/global-table-column.entity'
import { GlobalTableRowSchema } from '../../../server/entities/global-table-row.entity'

const mockGetDataSource = vi.fn()

vi.mock('~~/server/utils/db', () => ({
  getDataSource: () => mockGetDataSource(),
}))

// Re-export real modules via relative paths (vitest `~~` alias points at
// ./server, so `~~/server/...` does not resolve; mirror relation.test.ts pattern).
vi.mock('~~/server/entities/global-table.entity', async () => await import('../../../server/entities/global-table.entity'))
vi.mock('~~/server/entities/global-table-column.entity', async () => await import('../../../server/entities/global-table-column.entity'))
vi.mock('~~/server/entities/global-table-row.entity', async () => await import('../../../server/entities/global-table-row.entity'))
vi.mock('~~/server/entities/permission.entity', () => ({ PermissionSchema: {} }))
vi.mock('~~/server/entities/permission-method.entity', () => ({ PermissionMethodSchema: {} }))
vi.mock('~~/server/entities/permission-url.entity', () => ({ PermissionUrlSchema: {} }))
vi.mock('~~/server/entities/role.entity', () => ({ RoleSchema: {} }))
vi.mock('~~/server/dto/table-data.dto', async () => await import('../../../server/dto/table-data.dto'))
vi.mock('~~/server/utils/dynamic-schema', async () => await import('../../../server/utils/dynamic-schema'))
vi.mock('~~/server/utils/csv-safety', async () => await import('../../../server/utils/csv-safety'))
vi.mock('~~/server/utils/audit-redaction', async () => await import('../../../server/utils/audit-redaction'))

vi.mock('~~/server/services/activity-logs.service', () => ({
  ActivityLogsService: { log: vi.fn().mockResolvedValue({}) },
}))

vi.mock('~~/server/services/computed-field.service', () => ({
  getComputedColumnsForTable: vi.fn().mockResolvedValue([]),
  recomputeRow: (cols: any[], values: Record<string, any>) => ({ values, errors: {} }),
}))

vi.mock('~~/server/services/relation.service', () => ({
  parseRelationConfig: async (configStr: string | null) => {
    if (!configStr) return null
    try {
      const config = JSON.parse(configStr)
      return {
        displayColumns: config.displayColumns || [],
        separator: config.separator || ' - ',
        onTargetDelete: config.onTargetDelete || 'restrict',
      }
    } catch {
      return null
    }
  },
}))

function col(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    globalTableId: 1,
    name: 'nama',
    displayName: 'Nama',
    type: 'text',
    defaultValue: null,
    required: false,
    searchable: true,
    orderable: true,
    position: 0,
    options: null,
    format: null,
    expression: null,
    dependencies: null,
    relationTableId: null,
    relationConfig: null,
    ...overrides,
  }
}

describe('dynamic-schema', () => {
  describe('isComputedType / stripComputedInputs (BR-004)', () => {
    it('identifies computed types', () => {
      expect(isComputedType('hidden-computed')).toBe(true)
      expect(isComputedType('readonly-computed')).toBe(true)
      expect(isComputedType('text')).toBe(false)
    })

    it('ignores readonly/hidden computed values in write payloads', () => {
      const columns = [col({ name: 'nama' }), col({ name: 'total', type: 'readonly-computed' })]
      const out = stripComputedInputs(columns as any, { nama: 'A', total: 999 })
      expect(out).toEqual({ nama: 'A' })
    })
  })

  describe('validateRowValues (REQ-003, BR-003)', () => {
    it('enforces required server-side', () => {
      const columns = [col({ name: 'nama', required: true })]
      const result = validateRowValues(columns as any, {})
      expect(result.valid).toBe(false)
      expect(result.errors.nama).toContain('required')
    })

    it('rejects wrong number type', () => {
      const columns = [col({ name: 'umur', type: 'number', displayName: 'Umur' })]
      const result = validateRowValues(columns as any, { umur: 'abc' })
      expect(result.valid).toBe(false)
      expect(result.errors.umur).toContain('number')
    })

    it('coerces numeric strings', () => {
      const columns = [col({ name: 'umur', type: 'number' })]
      const result = validateRowValues(columns as any, { umur: '42' })
      expect(result.valid).toBe(true)
      expect(result.values.umur).toBe(42)
    })

    it('rejects select values outside options', () => {
      const columns = [
        col({ name: 'status', type: 'select', options: JSON.stringify([{ label: 'A', value: 'a' }]) }),
      ]
      const result = validateRowValues(columns as any, { status: 'zzz' })
      expect(result.valid).toBe(false)
      expect(result.errors.status).toContain('one of')
    })

    it('normalizes dates to ISO', () => {
      const columns = [col({ name: 'tgl', type: 'date' })]
      const result = validateRowValues(columns as any, { tgl: '2026-01-15' })
      expect(result.valid).toBe(true)
      expect(String(result.values.tgl)).toContain('2026-01-15')
    })

    it('rejects invalid dates', () => {
      const columns = [col({ name: 'tgl', type: 'date' })]
      const result = validateRowValues(columns as any, { tgl: 'not-a-date' })
      expect(result.valid).toBe(false)
    })

    it('validates single relation ids', () => {
      const columns = [col({ name: 'dept', type: 'select-table-relation', relationTableId: 2 })]
      expect(validateRowValues(columns as any, { dept: 3 }).valid).toBe(true)
      expect(validateRowValues(columns as any, { dept: 'abc' }).valid).toBe(false)
    })

    it('validates multi relation arrays', () => {
      const columns = [col({ name: 'tags', type: 'select-table-relation-multiple', relationTableId: 2 })]
      expect(validateRowValues(columns as any, { tags: [1, 2] }).valid).toBe(true)
      expect(validateRowValues(columns as any, { tags: 'nope' }).valid).toBe(false)
    })

    it('applies column defaultValue when the key is absent', () => {
      const columns = [col({ name: 'gelar', defaultValue: 'Staff' })]
      const result = validateRowValues(columns as any, {})
      expect(result.valid).toBe(true)
      expect(result.values.gelar).toBe('Staff')
    })
  })

  describe('coerceCsvCell', () => {
    it('parses numbers and relation ids', () => {
      expect(coerceCsvCell('number', '42')).toBe(42)
      expect(coerceCsvCell('select-table-relation', '7')).toBe(7)
      expect(coerceCsvCell('select-table-relation-multiple', '1; 2;3')).toEqual([1, 2, 3])
      expect(coerceCsvCell('text', '')).toBeNull()
    })
  })
})

describe('table-data.service CSV helpers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('parseCsv handles quotes, commas and newlines', () => {
    const rows = TableDataService.parseCsv('a,b\n"hello, world",2\n"x""y""",3')
    expect(rows).toEqual([['a', 'b'], ['hello, world', '2'], ['x"y"', '3']])
  })

  it('escapeCsvCell quotes cells with commas/quotes', () => {
    expect(TableDataService.escapeCsvCell('a,b')).toBe('"a,b"')
    expect(TableDataService.escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
    expect(TableDataService.escapeCsvCell(null)).toBe('')
    expect(TableDataService.escapeCsvCell([1, 2])).toBe('1;2')
  })
})

describe('table-data.service findAll scoping', () => {
  beforeEach(() => vi.clearAllMocks())

  function mockDb(columns: any[], rows: any[]) {
    mockGetDataSource.mockResolvedValue({
      getRepository: (schema: any) => {
        if (schema === GlobalTableSchema) {
          return { findOne: vi.fn().mockResolvedValue({ id: 1, name: 'pegawai', displayName: 'Pegawai' }) }
        }
        if (schema === GlobalTableColumnSchema) {
          return { find: vi.fn().mockResolvedValue(columns) }
        }
        if (schema === GlobalTableRowSchema) {
          return {
            find: vi.fn().mockResolvedValue(rows),
            createQueryBuilder: () => ({ where: () => ({ getMany: () => Promise.resolve([]) }) }),
          }
        }
        return { find: vi.fn().mockResolvedValue([]) }
      },
    })
  }

  it('returns 422 NOT_ORDERABLE for non-orderable sort (AC-005)', async () => {
    mockDb([col({ name: 'nama', orderable: false })], [])
    await expect(
      TableDataService.findAll('pegawai', { page: 1, limit: 20, sortBy: 'nama', sortOrder: 'ASC' }),
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  it('searches only searchable columns (BR-002)', async () => {
    const columns = [
      col({ name: 'nama', searchable: true }),
      col({ name: 'nik', searchable: false }),
    ]
    const rows = [
      { id: 1, globalTableId: 1, values: JSON.stringify({ nama: 'Budi', nik: 'SECRET123' }) },
      { id: 2, globalTableId: 1, values: JSON.stringify({ nama: 'Sari', nik: 'other' }) },
    ]
    mockDb(columns, rows)
    const result = await TableDataService.findAll(
      'pegawai',
      { page: 1, limit: 20, search: 'secret123', sortBy: 'id', sortOrder: 'DESC' },
    )
    // nik is not searchable → no match via global search
    expect(result.total).toBe(0)
  })

  it('supports field-specific search on searchable columns', async () => {
    const columns = [col({ name: 'nama', searchable: true })]
    const rows = [
      { id: 1, globalTableId: 1, values: JSON.stringify({ nama: 'Budi' }) },
      { id: 2, globalTableId: 1, values: JSON.stringify({ nama: 'Sari' }) },
    ]
    mockDb(columns, rows)
    const result = await TableDataService.findAll(
      'pegawai',
      { page: 1, limit: 20, search: 'bud', searchField: 'nama', sortBy: 'id', sortOrder: 'DESC' },
    )
    expect(result.total).toBe(1)
    expect((result.data[0] as any).nama).toBe('Budi')
  })

  it('returns 404 for unknown tableName (BR-001)', async () => {
    mockGetDataSource.mockResolvedValue({
      getRepository: () => ({ findOne: vi.fn().mockResolvedValue(null) }),
    })
    await expect(
      TableDataService.findAll('nope', { page: 1, limit: 20, sortBy: 'id', sortOrder: 'DESC' }),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns 422 NOT_SEARCHABLE for field search on a non-searchable column', async () => {
    mockDb(
      [col({ name: 'nama', searchable: true }), col({ name: 'nik', searchable: false })],
      [],
    )
    const err = await TableDataService.findAll(
      'pegawai',
      { page: 1, limit: 20, search: 'x', searchField: 'nik', sortBy: 'id', sortOrder: 'DESC' },
    ).catch((e) => e)
    expect(err.statusCode).toBe(422)
    expect(err.data?.code).toBe('NOT_SEARCHABLE')
  })

  it('treats searchField without search text as a no-op', async () => {
    const columns = [col({ name: 'nama', searchable: false })]
    const rows = [
      { id: 1, globalTableId: 1, values: JSON.stringify({ nama: 'Budi' }) },
    ]
    mockDb(columns, rows)
    const result = await TableDataService.findAll(
      'pegawai',
      { page: 1, limit: 20, searchField: 'nama', sortBy: 'id', sortOrder: 'DESC' },
    )
    expect(result.total).toBe(1)
  })

  it('exposes defaultValue in the browse column payload', async () => {
    mockDb([col({ name: 'gelar', defaultValue: 'Staff' })], [])
    const result = await TableDataService.findAll(
      'pegawai',
      { page: 1, limit: 20, sortBy: 'id', sortOrder: 'DESC' },
    )
    expect(result.columns[0]).toMatchObject({ name: 'gelar', defaultValue: 'Staff' })
  })
})

describe('global_table_rows schema (Task 12 Data Model: FK + composite index)', () => {
  it('declares FK to global_tables with ON DELETE CASCADE', () => {
    const relations: any = (GlobalTableRowSchema as any).options.relations
    expect(relations?.table?.target).toBe('global_tables')
    expect(relations?.table?.type).toBe('many-to-one')
    expect(relations?.table?.onDelete).toBe('CASCADE')
  })

  it('has composite INDEX(globalTableId, id)', () => {
    const indices: any[] = (GlobalTableRowSchema as any).options.indices ?? []
    expect(
      indices.some((ix) => JSON.stringify(ix.columns) === JSON.stringify(['globalTableId', 'id'])),
    ).toBe(true)
  })
})

describe('table-data.service remove restrict/detach (REQ-004)', () => {
  beforeEach(() => vi.clearAllMocks())

  function mockDbForRemove(ownerRows: any[], relationCol: any) {
    const saved: any[] = []
    const removed: any[] = []
    const rowRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 5, globalTableId: 2, values: JSON.stringify({ nama: 'Target' }) }),
      find: vi.fn().mockImplementation((opts: any) => {
        if (opts?.where?.globalTableId === 1) return Promise.resolve(ownerRows)
        return Promise.resolve([])
      }),
      count: vi.fn().mockResolvedValue(0),
      save: vi.fn().mockImplementation((e: any) => {
        saved.push(e)
        return Promise.resolve(e)
      }),
      remove: vi.fn().mockImplementation((e: any) => {
        removed.push(e)
        return Promise.resolve(e)
      }),
    }
    mockGetDataSource.mockResolvedValue({
      getRepository: (schema: any) => {
        if (schema === GlobalTableSchema) {
          return { findOne: vi.fn().mockResolvedValue({ id: 2, name: 'target', displayName: 'Target' }) }
        }
        if (schema === GlobalTableColumnSchema) {
          return { find: vi.fn().mockResolvedValue([relationCol]) }
        }
        return rowRepo
      },
    })
    return { saved, removed }
  }

  it('blocks delete with 409 when a restrict relation references the row', async () => {
    const relationCol = col({
      id: 9, globalTableId: 1, name: 'dept', type: 'select-table-relation',
      relationTableId: 2,
      relationConfig: JSON.stringify({ displayColumns: ['nama'], onTargetDelete: 'restrict' }),
    })
    mockDbForRemove(
      [{ id: 11, globalTableId: 1, values: JSON.stringify({ dept: 5 }) }],
      relationCol,
    )
    await expect(TableDataService.remove('target', 5)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('detaches silently when policy is detach', async () => {
    const relationCol = col({
      id: 9, globalTableId: 1, name: 'dept', type: 'select-table-relation',
      relationTableId: 2,
      relationConfig: JSON.stringify({ displayColumns: ['nama'], onTargetDelete: 'detach' }),
    })
    const { saved } = mockDbForRemove(
      [{ id: 11, globalTableId: 1, values: JSON.stringify({ dept: 5 }) }],
      relationCol,
    )
    await TableDataService.remove('target', 5)
    expect(saved.length).toBe(1)
    expect(JSON.parse(saved[0].values).dept).toBeNull()
  })
})
