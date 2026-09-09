import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GlobalTablesService } from '../../../server/services/global-tables.service'
import { GlobalTableSchema } from '../../../server/entities/global-table.entity'
import { GlobalTableColumnSchema } from '../../../server/entities/global-table-column.entity'
import { GlobalTableRowSchema } from '../../../server/entities/global-table-row.entity'

const mockGetDataSource = vi.fn()

vi.mock('~~/server/utils/db', () => ({
  getDataSource: () => mockGetDataSource(),
}))

// Re-export real modules via relative paths (vitest `~~` alias points at
// ./server, so `~~/server/...` does not resolve; mirror table-data.test.ts pattern).
vi.mock('~~/server/entities/global-table.entity', async () => await import('../../../server/entities/global-table.entity'))
vi.mock('~~/server/entities/global-table-column.entity', async () => await import('../../../server/entities/global-table-column.entity'))
vi.mock('~~/server/entities/global-table-row.entity', async () => await import('../../../server/entities/global-table-row.entity'))
vi.mock('~~/server/dto/global-tables.dto', async () => await import('../../../server/dto/global-tables.dto'))
vi.mock('~~/server/services/navigation.service', () => ({
  invalidateNavigationCache: vi.fn(),
}))

describe('GlobalTablesService.remove orphan cleanup (Task 12 must-fix)', () => {
  beforeEach(() => vi.clearAllMocks())

  function mockDb(opts: { table: any; relationRefs: Array<{ globalTableId: number; name: string }> }) {
    const removed: any[] = []
    const tableRepo = {
      findOne: vi.fn().mockResolvedValue(opts.table),
      remove: vi.fn().mockImplementation((e: any) => {
        removed.push(e)
        return Promise.resolve(e)
      }),
      createQueryBuilder: () => ({
        where: () => ({
          getMany: () => Promise.resolve([]),
        }),
      }),
    }
    const childRepo = () => ({
      delete: vi.fn().mockImplementation((_criteria: any) => Promise.resolve({ affected: 1 })),
    })
    const rowRepo = childRepo()
    const colRepo = childRepo()
    mockGetDataSource.mockResolvedValue({
      hasMetadata: (name: string) => name === 'global_table_rows' || name === 'global_table_columns',
      getRepository: (schema: any) => {
        if (schema === GlobalTableSchema) return tableRepo
        if (schema === GlobalTableRowSchema) return rowRepo
        if (schema === GlobalTableColumnSchema) return colRepo
        return { find: vi.fn().mockResolvedValue([]) }
      },
      query: vi.fn().mockResolvedValue(opts.relationRefs),
    })
    return { removed, rowRepo, colRepo, tableRepo }
  }

  it('deletes child rows + columns before removing the table', async () => {
    const { rowRepo, colRepo, tableRepo } = mockDb({
      table: { id: 7, name: 'pegawai', displayName: 'Pegawai' },
      relationRefs: [],
    })
    const result = await GlobalTablesService.remove(7)
    expect(result).toMatchObject({ message: 'Global table deleted' })
    expect(rowRepo.delete).toHaveBeenCalledWith({ globalTableId: 7 })
    expect(colRepo.delete).toHaveBeenCalledWith({ globalTableId: 7 })
    expect(tableRepo.remove).toHaveBeenCalledTimes(1)
  })

  it('throws 404 when the table does not exist', async () => {
    mockDb({ table: null, relationRefs: [] })
    await expect(GlobalTablesService.remove(999)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('still blocks delete with 409 when another table references it', async () => {
    const { rowRepo, tableRepo } = mockDb({
      table: { id: 7, name: 'dept', displayName: 'Dept' },
      relationRefs: [{ globalTableId: 9, name: 'dept_id' }],
    })
    await expect(GlobalTablesService.remove(7)).rejects.toMatchObject({ statusCode: 409 })
    expect(rowRepo.delete).not.toHaveBeenCalled()
    expect(tableRepo.remove).not.toHaveBeenCalled()
  })
})
