import { defineEventHandler, getRouterParam, readBody, createError, setResponseStatus } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { TableDataService } from '~~/server/services/table-data.service'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const tableName = getRouterParam(event, 'tableName')
  if (!tableName) throw createError({ statusCode: 400, message: 'Invalid table name' })

  const body = await readBody(event).catch(() => ({}))
  try {
    const created = await TableDataService.create(tableName, body ?? {}, userId)
    setResponseStatus(event, 201)
    return created
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
