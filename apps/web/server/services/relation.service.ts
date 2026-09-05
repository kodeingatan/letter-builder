import { getDataSource } from '~~/server/utils/db'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'
import { GlobalTableColumnSchema } from '~~/server/entities/global-table-column.entity'
import { GlobalTableRowSchema } from '~~/server/entities/global-table-row.entity'
import { RelationConfigSchema } from '~~/server/dto/global-table-columns.dto'

export interface LookupItem {
  id: number
  label: string
  raw: Record<string, any>
}

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

export async function getRelationDisplayColumns(targetTableId: number): Promise<string[]> {
  const ds = await getDataSource()
  const repo = ds.getRepository(GlobalTableColumnSchema)
  const columns = await repo.find({
    where: { globalTableId: targetTableId },
    order: { position: 'ASC' },
  })
  return columns
    .filter(c => c.type !== 'hidden-computed' && c.type !== 'readonly-computed')
    .map(c => c.name)
}

export async function composeRelationLabel(
  targetTableId: number,
  config: { displayColumns: string[]; separator?: string; maxDepth?: number },
  rowData: Record<string, any>,
  currentDepth = 0,
  visitedTables = new Set<number>()
): Promise<string> {
  const maxDepth = config.maxDepth ?? 3

  if (currentDepth > maxDepth) {
    return String(rowData.id)
  }

  const separator = config.separator ?? ' - '
  const parts: string[] = []

  for (const colName of config.displayColumns) {
    const value = rowData[colName]
    if (value === null || value === undefined) {
      parts.push('')
      continue
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      parts.push(String(value.id ?? ''))
    } else {
      parts.push(String(value))
    }
  }

  return parts.join(separator)
}

export async function lookupRelationRows(
  targetTableId: number,
  config: { displayColumns: string[]; separator?: string },
  options: { search?: string; limit?: number; page?: number; columnId?: number } = {}
): Promise<{ data: LookupItem[]; total: number }> {
  const { search, limit = 20, page = 1 } = options

  const ds = await getDataSource()
  const targetTable = await ds.getRepository(GlobalTableSchema).findOne({ where: { id: targetTableId } })
  if (!targetTable) {
    throw httpError(404, 'Target table not found')
  }

  // JSON-per-row store (Task 12): all rows live in global_table_rows.
  const entities: any[] = await ds.getRepository(GlobalTableRowSchema).find({
    where: { globalTableId: targetTableId },
    order: { id: 'ASC' },
  })
  const parsed = entities.map((e) => {
    let values: Record<string, any> = {}
    try {
      values = JSON.parse(e.values)
    } catch {
      values = {}
    }
    return { id: e.id, ...values }
  })

  const needle = (search ?? '').toLowerCase()
  const filtered = needle
    ? parsed.filter((r) =>
        config.displayColumns.some((col) => String(r[col] ?? '').toLowerCase().includes(needle)),
      )
    : parsed

  const total = filtered.length
  const paged = filtered.slice((page - 1) * limit, page * limit)

  const data: LookupItem[] = paged.map((row) => {
    const raw: Record<string, any> = { id: row.id }
    for (const col of config.displayColumns) {
      raw[col] = row[col]
    }
    return {
      id: row.id,
      label: config.displayColumns.map((col) => String(row[col] ?? '')).join(config.separator ?? ' - '),
      raw,
    }
  })

  return { data, total }
}

export async function validateRelationConfig(
  relationTableId: number,
  configStr: string,
  ownerTableId: number,
  columnName?: string
): Promise<{ valid: boolean; error?: string }> {
  const ds = await getDataSource()

  const targetTable = await ds.getRepository(GlobalTableSchema).findOne({ where: { id: relationTableId } })
  if (!targetTable) {
    return { valid: false, error: `Target table ${relationTableId} does not exist` }
  }

  if (relationTableId === ownerTableId) {
    return { valid: false, error: 'Self-referencing tables are not allowed' }
  }

  let config: { displayColumns: string[]; separator?: string; onTargetDelete?: string }
  try {
    config = JSON.parse(configStr)
  } catch {
    return { valid: false, error: 'Invalid relationConfig JSON' }
  }

  const parsed = RelationConfigSchema.safeParse(config)
  if (!parsed.success) {
    return { valid: false, error: parsed.error.errors[0].message }
  }

  const displayColumns = parsed.data.displayColumns
  const targetColumns = await getRelationDisplayColumns(relationTableId)
  const missingColumns = displayColumns.filter(col => !targetColumns.includes(col))
  if (missingColumns.length > 0) {
    return { valid: false, error: `Display columns not found on target: ${missingColumns.join(', ')}` }
  }

  const ownerColumns: any[] = await ds.getRepository(GlobalTableColumnSchema).find({
    where: { globalTableId: ownerTableId },
  })
  const ownerRelationCols = ownerColumns.filter(c => c.type === 'select-table-relation' || c.type === 'select-table-relation-multiple')

  for (const relCol of ownerRelationCols) {
    if (columnName && relCol.name === columnName) continue
    if (relCol.relationTableId === relationTableId) {
      return { valid: false, error: `Target table already referenced by column "${relCol.name}" on owner table` }
    }
  }

  return { valid: true }
}

export async function parseRelationConfig(configStr: string | null): Promise<{ displayColumns: string[]; separator: string; onTargetDelete: 'restrict' | 'detach' } | null> {
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
}

export async function isTableTargeted(tableId: number): Promise<boolean> {
  const ds = await getDataSource()
  const count = await ds.getRepository(GlobalTableColumnSchema).count({
    where: { relationTableId: tableId },
  })
  return count > 0
}

export async function isRowReferenced(tableId: number, rowId: number): Promise<{ isReferenced: boolean; relationCols: Array<{ id: number; name: string; onTargetDelete: string }> }> {
  const ds = await getDataSource()
  const columnRepo = ds.getRepository(GlobalTableColumnSchema)

  // Find all relation columns that point to this table
  const relatedColumns = await columnRepo.find({
    where: { relationTableId: tableId },
  })

  if (relatedColumns.length === 0) {
    return { isReferenced: false, relationCols: [] }
  }

  // Verify the row actually exists in the target table (JSON-per-row store)
  const rowRepo = ds.getRepository(GlobalTableRowSchema)
  const rowExists = await rowRepo.count({ where: { id: rowId, globalTableId: tableId } as any })
  if (rowExists === 0) {
    return { isReferenced: false, relationCols: [] }
  }

  const referencedFromColumns: Array<{ id: number; name: string; onTargetDelete: string }> = []

  for (const column of relatedColumns) {
    const config = await parseRelationConfig(column.relationConfig)
    if (!config || !config.displayColumns || config.displayColumns.length === 0) {
      continue
    }

    // Check the owner table's rows for references to this row id
    const ownerRows: any[] = await rowRepo.find({ where: { globalTableId: (column as any).globalTableId } as any })
    const ownerColumnName = (column as any).name

    if ((column as any).type === 'select-table-relation') {
      // Single relation: any owner row whose column value = rowId
      const count = ownerRows.filter((r) => {
        try {
          const vals = JSON.parse(r.values)
          return Number(vals[ownerColumnName]) === rowId
        } catch {
          return false
        }
      }).length
      if (count > 0) {
        referencedFromColumns.push({
          id: (column as any).id,
          name: (column as any).name,
          onTargetDelete: config.onTargetDelete || 'restrict',
        })
      }
    }

    if ((column as any).type === 'select-table-relation-multiple') {
      // Multi relation: any owner row whose column array contains rowId
      let hit = false
      for (const r of ownerRows) {
        try {
          const vals = JSON.parse(r.values)
          const val = vals[ownerColumnName]
          const ids = typeof val === 'string' ? JSON.parse(val) : val
          if (Array.isArray(ids) && ids.map(Number).includes(rowId)) {
            hit = true
            break
          }
        } catch {
          // Ignore parse errors
        }
      }
      if (hit) {
        referencedFromColumns.push({
          id: (column as any).id,
          name: (column as any).name,
          onTargetDelete: config.onTargetDelete || 'detach',
        })
      }
    }
  }

  return {
    isReferenced: referencedFromColumns.length > 0,
    relationCols: referencedFromColumns,
  }
}
