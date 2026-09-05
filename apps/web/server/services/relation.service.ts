import { getDataSource } from '~~/server/utils/db'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'
import { GlobalTableColumnSchema } from '~~/server/entities/global-table-column.entity'
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

  const dataTableName = `global_table_data_${targetTableId}`
  let qb = ds.manager.createQueryBuilder().from(dataTableName, 'row')

  if (search) {
    const searchConditions = config.displayColumns.map((col) => `CAST(row.${col} AS TEXT) LIKE :search`)
    qb = qb.where(`(${searchConditions.join(' OR ')})`, { search: `%${search}%` })
  }

  const total = await qb.getCount()
  const rows = await qb
    .select('row.id')
    .addSelect(config.displayColumns.map(col => `row.${col}`), config.displayColumns)
    .skip((page - 1) * limit)
    .take(limit)
    .orderBy('row.id', 'ASC')
    .getRawMany()

  const data: LookupItem[] = rows.map(row => {
    const raw: Record<string, any> = { id: row.id }
    for (const col of config.displayColumns) {
      raw[col] = row[col]
    }
    return {
      id: row.id,
      label: config.displayColumns.map(col => String(row[col] ?? '')).join(config.separator ?? ' - '),
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

  const ownerColumns = await ds.getRepository(GlobalTableColumnSchema).find({
    where: { globalTableId: ownerTableId },
    select: ['name', 'type'],
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

  // Verify the row actually exists in the target table
  const globalTableDataRepo = ds.getRepository(`global_table_data_${tableId}`)
  const rowExists = await globalTableDataRepo.count({ where: { id: rowId } })
  if (rowExists === 0) {
    return { isReferenced: false, relationCols: [] }
  }

  const referencedFromColumns: Array<{ id: number; name: string; onTargetDelete: string }> = []

  for (const column of relatedColumns) {
    const config = await parseRelationConfig(column.relationConfig)
    if (!config || !config.displayColumns || config.displayColumns.length === 0) {
      continue
    }

    // Check the owner table's data for references to this row
    const ownerDataRepo = ds.getRepository(`global_table_data_${column.globalTableId}`)
    const ownerColumnName = column.name

    if (column.type === 'select-table-relation') {
      // Single relation: check if any row has this column value = rowId
      const count = await ownerDataRepo
        .createQueryBuilder()
        .where(`"${ownerColumnName}" = :rowId`, { rowId })
        .getCount()
      if (count > 0) {
        referencedFromColumns.push({
          id: column.id,
          name: column.name,
          onTargetDelete: config.onTargetDelete || 'restrict',
        })
      }
    }

    if (column.type === 'select-table-relation-multiple') {
      // Multi relation: check if any row has this column containing rowId in JSON array
      const rows = await ownerDataRepo.find()
      for (const row of rows as any[]) {
        const val = row[ownerColumnName]
        if (val) {
          try {
            const ids = typeof val === 'string' ? JSON.parse(val) : val
            if (Array.isArray(ids) && ids.includes(rowId)) {
              referencedFromColumns.push({
                id: column.id,
                name: column.name,
                onTargetDelete: config.onTargetDelete || 'detach',
              })
              break
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }

  return {
    isReferenced: referencedFromColumns.length > 0,
    relationCols: referencedFromColumns,
  }
}
