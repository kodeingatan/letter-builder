import { defineEventHandler, getRouterParam, createError, setResponseStatus } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { TableDataService } from '~~/server/services/table-data.service'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const tableName = getRouterParam(event, 'tableName')
  const rowId = Number(getRouterParam(event, 'rowId'))
  if (!tableName || Number.isNaN(rowId)) throw createError({ statusCode: 400, message: 'Invalid table or row id' })

  try {
    const result = await TableDataService.remove(tableName, rowId, userId)
    setResponseStatus(event, 200)
    return result
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
