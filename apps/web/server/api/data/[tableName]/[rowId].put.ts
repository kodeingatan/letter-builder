import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { TableDataService } from '~~/server/services/table-data.service'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const tableName = getRouterParam(event, 'tableName')
  const rowId = Number(getRouterParam(event, 'rowId'))
  if (!tableName || Number.isNaN(rowId)) throw createError({ statusCode: 400, message: 'Invalid table or row id' })

  const body = await readBody(event).catch(() => ({}))
  try {
    return await TableDataService.update(tableName, rowId, body ?? {}, userId)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
