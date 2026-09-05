import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { GlobalTableColumnService } from '~~/server/services/global-table-column.service'
import { GlobalTableColumnQuerySchema } from '~~/server/dto/global-table-columns.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const tableId = Number(getRouterParam(event, 'id'))
  if (isNaN(tableId)) throw createError({ statusCode: 400, message: 'Invalid table id' })

  const query = getQuery(event)
  const parsed = GlobalTableColumnQuerySchema.safeParse(query)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })

  try {
    return await GlobalTableColumnService.findAllByTable(tableId, parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message })
  }
})