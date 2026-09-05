import { describe, it, expect, vi, beforeEach } from 'vitest'
import { composeRelationLabel, parseRelationConfig, validateRelationConfig, isTableTargeted, isRowReferenced } from '../../../server/services/relation.service'

const mockGetDataSource = vi.fn()

vi.mock('~~/server/utils/db', () => ({
  getDataSource: () => mockGetDataSource(),
}))

vi.mock('~~/server/entities/global-table.entity', () => ({
  GlobalTableSchema: {},
}))

vi.mock('~~/server/entities/global-table-column.entity', () => ({
  GlobalTableColumnSchema: {},
}))

vi.mock('~~/server/dto/global-table-columns.dto', () => ({
  RelationConfigSchema: {
    safeParse: vi.fn((data: any) => ({ success: true, data })),
  },
}))

describe('relation.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('composeRelationLabel', () => {
    it('joins display columns with separator', async () => {
      const config = { displayColumns: ['firstName', 'lastName'], separator: ' - ' }
      const rowData = { id: 1, firstName: 'John', lastName: 'Doe' }

      const result = await composeRelationLabel(1, config, rowData)

      expect(result).toBe('John - Doe')
    })

    it('uses default separator when not provided', async () => {
      const config = { displayColumns: ['name'] }
      const rowData = { id: 1, name: 'Test' }

      const result = await composeRelationLabel(1, config, rowData)

      expect(result).toBe('Test')
    })

    it('handles missing column values gracefully', async () => {
      const config = { displayColumns: ['firstName', 'middleName', 'lastName'], separator: ' ' }
      const rowData = { id: 1, firstName: 'John', lastName: 'Doe' }

      const result = await composeRelationLabel(1, config, rowData)

      expect(result).toBe('John  Doe')
    })

    it('handles null/undefined values', async () => {
      const config = { displayColumns: ['firstName', 'lastName'], separator: ' - ' }
      const rowData = { id: 1, firstName: null, lastName: 'Doe' }

      const result = await composeRelationLabel(1, config, rowData)

      expect(result).toBe(' - Doe')
    })

    it('converts object values to id string', async () => {
      const config = { displayColumns: ['user'], separator: ' - ' }
      const rowData = { id: 1, user: { id: 5, name: 'Admin' } }

      const result = await composeRelationLabel(1, config, rowData)

      expect(result).toBe('5')
    })

    it('handles array values by converting to string', async () => {
      const config = { displayColumns: ['tags'], separator: ' - ' }
      const rowData = { id: 1, tags: ['a', 'b', 'c'] }

      const result = await composeRelationLabel(1, config, rowData)

      expect(result).toBe('a,b,c')
    })

    it('respects maxDepth to prevent infinite recursion', async () => {
      const config = { displayColumns: ['related'], separator: ' - ', maxDepth: 2 }
      const rowData = { id: 1, related: { id: 2, related: { id: 3 } } }

      const result = await composeRelationLabel(1, config, rowData, 2)

      expect(result).toBe('2')
    })
  })

  describe('parseRelationConfig', () => {
    it('parses valid JSON config', async () => {
      const configStr = JSON.stringify({
        displayColumns: ['name', 'email'],
        separator: ', ',
        onTargetDelete: 'detach',
      })

      const result = await parseRelationConfig(configStr)

      expect(result).toEqual({
        displayColumns: ['name', 'email'],
        separator: ', ',
        onTargetDelete: 'detach',
      })
    })

    it('returns defaults for missing fields', async () => {
      const configStr = JSON.stringify({
        displayColumns: ['name'],
      })

      const result = await parseRelationConfig(configStr)

      expect(result).toEqual({
        displayColumns: ['name'],
        separator: ' - ',
        onTargetDelete: 'restrict',
      })
    })

    it('returns null for null input', async () => {
      const result = await parseRelationConfig(null)
      expect(result).toBeNull()
    })

    it('returns null for invalid JSON', async () => {
      const result = await parseRelationConfig('not valid json')
      expect(result).toBeNull()
    })

    it('returns null for empty string', async () => {
      const result = await parseRelationConfig('')
      expect(result).toBeNull()
    })
  })

  describe('validateRelationConfig', () => {
    it('rejects when target table does not exist', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockReturnValue({
          findOne: vi.fn().mockResolvedValue(null),
          find: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await validateRelationConfig(999, '{}', 1)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Target table 999 does not exist')
    })

    it('rejects self-referencing tables', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockReturnValue({
          findOne: vi.fn().mockResolvedValue({ id: 1, name: 'test' }),
          find: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await validateRelationConfig(1, '{}', 1)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Self-referencing tables are not allowed')
    })

    it('rejects invalid relationConfig JSON', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockReturnValue({
          findOne: vi.fn().mockResolvedValue({ id: 2, name: 'target' }),
          find: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await validateRelationConfig(2, 'invalid json', 1)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid relationConfig JSON')
    })

    it('rejects when display columns not found on target', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockReturnValue({
          findOne: vi.fn()
            .mockResolvedValueOnce({ id: 2, name: 'target' })
            .mockResolvedValueOnce({ id: 1, name: 'owner' }),
          find: vi.fn().mockResolvedValue([
            { name: 'id', type: 'number' },
            { name: 'name', type: 'text' },
          ]),
        }),
      })

      const config = JSON.stringify({ displayColumns: ['name', 'nonexistent'] })
      const result = await validateRelationConfig(2, config, 1)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Display columns not found on target')
    })

    it('rejects duplicate target table reference on same owner', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockReturnValue({
          findOne: vi.fn()
            .mockResolvedValueOnce({ id: 2, name: 'target' })
            .mockResolvedValueOnce({ id: 1, name: 'owner' }),
          find: vi.fn().mockResolvedValue([
            { name: 'name', type: 'text' },
            { name: 'other_ref', type: 'select-table-relation', relationTableId: 2 },
          ]),
        }),
      })

      const config = JSON.stringify({ displayColumns: ['name'] })
      const result = await validateRelationConfig(2, config, 1)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('already referenced by column')
    })

    it('allows valid configuration', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockReturnValue({
          findOne: vi.fn()
            .mockResolvedValueOnce({ id: 2, name: 'target' })
            .mockResolvedValueOnce({ id: 1, name: 'owner' }),
          find: vi.fn().mockResolvedValue([
            { name: 'name', type: 'text' },
          ]),
        }),
      })

      const config = JSON.stringify({ displayColumns: ['name'] })
      const result = await validateRelationConfig(2, config, 1)

      expect(result.valid).toBe(true)
    })
  })

  describe('isTableTargeted', () => {
    it('returns true when table is referenced by relation columns', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue(2),
        }),
      })

      const result = await isTableTargeted(1)

      expect(result).toBe(true)
    })

    it('returns false when table is not referenced', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue(0),
        }),
      })

      const result = await isTableTargeted(999)

      expect(result).toBe(false)
    })
  })

  describe('isRowReferenced', () => {
    it('returns false when no relation columns point to table', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockImplementation((schema: string) => {
          if (schema === 'global_table_data_1') {
            return { count: vi.fn().mockResolvedValue(1) }
          }
          return {
            find: vi.fn().mockResolvedValue([]),
          }
        }),
      })

      const result = await isRowReferenced(1, 1)

      expect(result.isReferenced).toBe(false)
      expect(result.relationCols).toEqual([])
    })

    it('returns false when row does not exist in target table', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockImplementation((schema: string) => {
          if (schema === 'global_table_data_1') {
            return { count: vi.fn().mockResolvedValue(0) }
          }
          return {
            find: vi.fn().mockResolvedValue([
              { id: 1, name: 'ref_col', type: 'select-table-relation', globalTableId: 2 },
            ]),
          }
        }),
      })

      const result = await isRowReferenced(1, 999)

      expect(result.isReferenced).toBe(false)
    })

    it('detects single relation reference', async () => {
      mockGetDataSource.mockResolvedValue({
        getRepository: vi.fn().mockImplementation((schema: string) => {
          if (schema === 'global_table_data_1') {
            return { count: vi.fn().mockResolvedValue(1) }
          }
          if (schema === 'global_table_data_2') {
            return {
              createQueryBuilder: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnThis(),
                getCount: vi.fn().mockResolvedValue(5),
              }),
            }
          }
          return {
            find: vi.fn().mockResolvedValue([
              {
                id: 1,
                name: 'user_id',
                type: 'select-table-relation',
                globalTableId: 2,
                relationConfig: JSON.stringify({ displayColumns: ['name'], onTargetDelete: 'restrict' }),
              },
            ]),
          }
        }),
      })

      const result = await isRowReferenced(1, 1)

      expect(result.isReferenced).toBe(true)
      expect(result.relationCols).toHaveLength(1)
      expect(result.relationCols[0].onTargetDelete).toBe('restrict')
    })
  })
})