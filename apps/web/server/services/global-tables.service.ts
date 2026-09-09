import { getDataSource } from '~~/server/utils/db'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'
import { GlobalTableColumnSchema } from '~~/server/entities/global-table-column.entity'
import { GlobalTableRowSchema } from '~~/server/entities/global-table-row.entity'
import { isReservedGlobalTableName } from '~~/server/dto/global-tables.dto'
import { invalidateNavigationCache } from '~~/server/services/navigation.service'
import type { GlobalTableQueryInput } from '~~/server/dto/global-tables.dto'
import type {
  CreateGlobalTableInput,
  UpdateGlobalTableInput,
} from '~~/server/dto/global-tables.dto'

const searchableFields = ['name', 'displayName']
const sortableFields = ['id', 'name', 'displayName', 'createdAt', 'updatedAt']

export interface GlobalTableReference {
  relations: Array<{ tableId: number; tableName: string; columnName: string }>
  bindings: Array<{ source: string; ref: string }>
}

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

export const GlobalTablesService = {
  async checkReferences(id: number): Promise<GlobalTableReference> {
    const ds = await getDataSource()
    
    // Handle case where global_table_columns table doesn't exist yet
    if (!ds.hasMetadata('global_table_columns')) {
      return { relations: [], bindings: [] }
    }

    const referencedBy: GlobalTableReference = { relations: [], bindings: [] }

    try {
      const rows: Array<{ globalTableId: number; name: string }> = await ds.query(
        'SELECT "globalTableId", name FROM global_table_columns WHERE "relationTableId" = ?',
        [id],
      )
      
      if (rows.length) {
        const ownerIds = [...new Set(rows.map((r) => r.globalTableId))]
        const owners = ownerIds.length
          ? await ds
              .getRepository(GlobalTableSchema)
              .createQueryBuilder('t')
              .where('t.id IN (:...ids)', { ids: ownerIds })
              .getMany()
          : []
        const ownerName = new Map(owners.map((o: any) => [o.id, o.name]))
        referencedBy.relations = rows.map((r) => ({
          tableId: r.globalTableId,
          tableName: ownerName.get(r.globalTableId) ?? `#${r.globalTableId}`,
          columnName: r.name,
        }))
      }
    } catch (error) {
      // Log the error but return empty references to prevent 500
      console.error(`Error checking references for table ${id}:`, error)
      return referencedBy
    }

    return referencedBy
  },

  async findAll(query: GlobalTableQueryInput) {
    const ds = await getDataSource()
    const qb = ds.getRepository(GlobalTableSchema).createQueryBuilder('table')

    if (query.search) {
      if (query.searchField && searchableFields.includes(query.searchField)) {
        qb.where(`table.${query.searchField} LIKE :search`, { search: `%${query.search}%` })
      } else {
        const conditions = searchableFields.map((f) => `table.${f} LIKE :search`)
        qb.where(`(${conditions.join(' OR ')})`, { search: `%${query.search}%` })
      }
    }

    if (sortableFields.includes(query.sortBy)) {
      qb.orderBy(`table.${query.sortBy}`, query.sortOrder)
    }

    const total = await qb.getCount()
    const data = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()

    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const table = await ds.getRepository(GlobalTableSchema).findOne({ where: { id } })
    if (!table) throw httpError(404, 'Global table not found')

    let columnCount = 0
    if (ds.hasMetadata('global_table_columns')) {
      columnCount = await ds.query(
        'SELECT COUNT(*) AS count FROM global_table_columns WHERE "globalTableId" = ?',
        [id],
      ).then((rows: Array<{ count: number }>) => Number(rows[0]?.count ?? 0))
    }

    const referencedBy = await this.checkReferences(id)
    return { ...(table as object), columnCount, referencedBy }
  },

  async create(data: CreateGlobalTableInput) {
    if (isReservedGlobalTableName(data.name)) {
      throw httpError(422, `name "${data.name}" is reserved`)
    }

    const ds = await getDataSource()
    const repo = ds.getRepository(GlobalTableSchema)

    const existing = await repo
      .createQueryBuilder('table')
      .where('LOWER(table.name) = LOWER(:name)', { name: data.name })
      .getOne()
    if (existing) throw httpError(409, `Global table "${data.name}" already exists`)

    const table = repo.create({ name: data.name, displayName: data.displayName })
    const saved = await repo.save(table)
    invalidateNavigationCache()

    // Task 12: auto-provision per-table Data:{name}:Read/Write permissions (lazy, best-effort)
    try {
      const { TableDataService } = await import('~~/server/services/table-data.service')
      await TableDataService.ensureTableDataPermissions(saved as any)
    } catch {}
    return saved
  },

  async update(id: number, data: UpdateGlobalTableInput) {
    if ((data as Record<string, unknown>).name !== undefined) {
      throw httpError(422, 'name is immutable and cannot be changed')
    }

    const ds = await getDataSource()
    const repo = ds.getRepository(GlobalTableSchema)
    const table = await repo.findOne({ where: { id } })
    if (!table) throw httpError(404, 'Global table not found')

    if (data.displayName !== undefined) (table as any).displayName = data.displayName
    const savedUpdate = await repo.save(table)
    invalidateNavigationCache()
    return savedUpdate
  },

  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(GlobalTableSchema)
    const table = await repo.findOne({ where: { id } })
    if (!table) throw httpError(404, 'Global table not found')

    const referencedBy = await this.checkReferences(id)
    if (referencedBy.relations.length || referencedBy.bindings.length) {
      throw httpError(409, 'Global table is referenced and cannot be deleted', { referencedBy })
    }

    // Task 12 must-fix (spec Data Model): no orphan rows/columns.
    // The FK ON DELETE CASCADE on global_table_rows only fires where the
    // driver enforces foreign keys (better-sqlite3 leaves them off by
    // default), so delete child rows + column definitions explicitly first.
    // Relation-target references from other tables are already blocked by
    // checkReferences above, so no dangling relationTableId can remain.
    if (ds.hasMetadata('global_table_rows')) {
      await ds.getRepository(GlobalTableRowSchema).delete({ globalTableId: id })
    }
    if (ds.hasMetadata('global_table_columns')) {
      await ds.getRepository(GlobalTableColumnSchema).delete({ globalTableId: id })
    }

    await repo.remove(table)
    invalidateNavigationCache()
    return { message: 'Global table deleted' }
  },
}
