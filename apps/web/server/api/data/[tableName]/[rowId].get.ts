import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { TableDataService } from '~~/server/services/table-data.service'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const tableName = getRouterParam(event, 'tableName')
  const rowId = Number(getRouterParam(event, 'rowId'))
  if (!tableName || Number.isNaN(rowId)) throw createError({ statusCode: 400, message: 'Invalid table or row id' })

  try {
    return await TableDataService.findOne(tableName, rowId)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 500, message: e.message, data: e.data })
  }
})
