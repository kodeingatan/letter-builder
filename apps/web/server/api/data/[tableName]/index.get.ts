import { defineEventHandler, getQuery, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { TableDataService } from '~~/server/services/table-data.service'
import { TableDataQuerySchema } from '~~/server/dto/table-data.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const tableName = getRouterParam(event, 'tableName')
  if (!tableName) throw createError({ statusCode: 400, message: 'Invalid table name' })

  const parsed = TableDataQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })

  try {
    return await TableDataService.findAll(tableName, parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 500, message: e.message, data: e.data })
  }
})
