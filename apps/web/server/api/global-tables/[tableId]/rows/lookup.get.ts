import { defineEventHandler, getQuery, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { lookupRelationRows, getRelationDisplayColumns } from '~~/server/services/relation.service'
import { GlobalTableColumnSchema } from '~~/server/entities/global-table-column.entity'
import { parseRelationConfig } from '~~/server/services/relation.service'
import { getDataSource } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const tableId = Number(getRouterParam(event, 'tableId'))
  if (isNaN(tableId)) throw createError({ statusCode: 400, message: 'Invalid table id' })

  const query = getQuery(event)
  const columnId = query.columnId ? Number(query.columnId) : undefined
  if (columnId !== undefined && isNaN(columnId)) throw createError({ statusCode: 400, message: 'Invalid column id' })

  const limit = Math.min(Number(query.limit || 20), 100)
  const page = Number(query.page || 1)
  const search = query.search || ''

  try {
    const ds = await getDataSource()
    const columnRepo = ds.getRepository(GlobalTableColumnSchema)

    // If columnId is provided, load the relation config from that column
    let displayColumns: string[] = []
    let separator = ' - '

    if (columnId) {
      const column = await columnRepo.findOne({ where: { id: columnId } })
      if (column && column.relationConfig) {
        const config = await parseRelationConfig(column.relationConfig)
        if (config) {
          displayColumns = config.displayColumns
          separator = config.separator
        }
      }
    }

    // Fallback: use first text column from target table
    if (displayColumns.length === 0) {
      const cols = await getRelationDisplayColumns(tableId)
      displayColumns = cols.length > 0 ? [cols[0]] : []
    }

    const result = await lookupRelationRows(tableId, { displayColumns, separator }, {
      search,
      limit,
      page,
      columnId: columnId !== undefined ? columnId : undefined,
    })
    return result
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 500, message: e.message })
  }
})