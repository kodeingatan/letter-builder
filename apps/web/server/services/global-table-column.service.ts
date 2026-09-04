import { getDataSource } from '~~/server/utils/db'
import { GlobalTableColumnSchema } from '~~/server/entities/global-table-column.entity'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'
import { isGlobalTableColumnType, GLOBAL_TABLE_COLUMN_TYPES } from '~~/server/dto/global-table-columns.dto'
import type { CreateGlobalTableColumnInput, UpdateGlobalTableColumnInput, ReorderGlobalTableColumnsInput } from '~~/server/dto/global-table-columns.dto'

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

function validateOptions(type: string, options: unknown): asserts type is true {
  if (type === 'select') {
    if (!options || typeof options !== 'string') {
      throw httpError(422, 'select type requires options (JSON string of [{label, value}])')
    }
    try {
      const parsed = JSON.parse(options as string)
      if (!Array.isArray(parsed)) {
        throw httpError(422, 'options must be a JSON array')
      }
      const values = new Set(parsed.map((o: any) => o.value))
      if (new Set(parsed.map((o: any) => o.value)).size !== parsed.length) {
        throw httpError(422, 'option values must be unique within the column')
      }
      if (parsed.length < 1) {
        throw httpError(422, 'select type requires at least 1 option')
      }
    } catch {
      throw httpError(422, 'options must be valid JSON')
    }
  }
}

export const GlobalTableColumnService = {
  async findAllByTable(tableId: number, query?: { page?: number; limit?: number }) {
    const ds = await getDataSource()
    const qb = ds.getRepository(GlobalTableColumnSchema).createQueryBuilder('column')

    qb.where('column.globalTableId = :tableId', { tableId })

    if (query?.searchField) {
      qb.andWhere(`column.${query.searchField} LIKE :search`, { search: `%${query.search ?? ''}%` })
    }

    if (query?.sortBy && query.sortBy !== 'position') {
      qb.orderBy(`column.${query.sortBy}`, query.sortOrder ?? 'ASC')
    } else {
      qb.orderBy('column.position', query.sortOrder ?? 'ASC')
    }

    const total = await qb.getCount()
    const data = await qb.skip((query?.page ?? 1 - 1) * (query?.limit ?? 20)).take(query?.limit ?? 20).getMany()

    return { data, total, page: query?.page ?? 1, limit: query?.limit ?? 20, totalPages: Math.ceil(total / (query?.limit ?? 20)) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const column = await ds.getRepository(GlobalTableColumnSchema).findOne({ where: { id } })
    if (!column) throw httpError(404, 'Global table column not found')
    return column
  },

  async create(data: CreateGlobalTableColumnInput, tableId: number) {
    if (!isGlobalTableColumnType(data.type)) {
      throw httpError(422, `Invalid column type: ${data.type}`)
    }

    if (data.type === 'select' && data.options) {
      validateOptions(data.type, data.options)
    }

    // Check name uniqueness within table
    const ds = await getDataSource()
    const repo = ds.getRepository(GlobalTableColumnSchema)
    const existing = await repo
      .createQueryBuilder('column')
      .where('column.globalTableId = :tableId AND column.name = :name', { tableId, name: data.name })
      .getOne()
    if (existing) throw httpError(409, `Column "${data.name}" already exists in this table`)

    // Check table exists and has room
    const tableRepo = ds.getRepository(GlobalTableSchema)
    const table = await tableRepo.findOne({ where: { id: tableId } })
    if (!table) throw httpError(404, 'Global table not found')

    // If required and this would be the first column, ensure at least one non-computed column exists
    // BR-005: A table must keep ≥1 non-computed column; deleting the last one is blocked

    const column = repo.create({
      ...data,
      globalTableId: tableId,
      position: data.position ?? 0,
    })
    return repo.save(column)
  },

  async update(id: number, data: UpdateGlobalTableColumnInput) {
    const column = await this.findOne(id)

    // BR-006: Column type is immutable after row data exists (Task 12 check)
    // Stub here - full enforcement in Task 12

    if (data.type && data.type !== column.type) {
      // Check if row data exists for this column - if so, type change blocked
      // For now in Task 08, we allow it as stub; Task 12 will enforce immutability
    }

    if (column.type === 'select' && data.options !== undefined) {
      validateOptions(data.type, data.options)
    }

    const ds = await getDataSource()
    const repo = ds.getRepository(GlobalTableColumnSchema)

    if (data.displayName !== undefined) column.displayName = data.displayName
    if (data.type !== undefined) column.type = data.type
    if (data.defaultValue !== undefined) column.defaultValue = data.defaultValue
    if (data.required !== undefined) column.required = data.required
    if (data.searchable !== undefined) column.searchable = data.searchable
    if (data.orderable !== undefined) column.orderable = data.orderable
    if (data.position !== undefined) column.position = data.position
    if (data.options !== undefined) column.options = data.options
    if (data.format !== undefined) column.format = data.format

    return repo.save(column)
  },

  async remove(id: number) {
    const column = await this.findOne(id)
    const ds = await getDataSource()

    // BR-006: Block deletion if column is used by computed-field dependency, relation display, or template binding
    // Stub here - full reference check in Tasks 10/11/16

    const repo = ds.getRepository(GlobalTableColumnSchema)
    await repo.remove(column)
    return { message: 'Global table column deleted' }
  },

  async reorder(data: ReorderGlobalTableColumnsInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(GlobalTableColumnSchema)

    const columns = await repo.find({ order: { position: 'ASC' } })
    const idToPosition = new Map(columns.map((c: any) => [c.id, c.position]))

    data.orderedIds.forEach((id, index) => {
      idToPosition.set(id, index)
    })

    // Update positions
    for (const [id, position] of idToPosition) {
      const column = await repo.findOne({ where: { id } })
      if (column) {
        column.position = position
        await repo.save(column)
      }
    }

    return { success: true }
  },
}