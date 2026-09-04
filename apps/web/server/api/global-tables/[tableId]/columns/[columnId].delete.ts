import { defineEventHandler, getRouterParam, createError, setResponseStatus } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { GlobalTableColumnService } from '~~/server/services/global-table-column.service'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const columnId = Number(getRouterParam(event, 'columnId'))
  if (isNaN(columnId)) throw createError({ statusCode: 400, message: 'Invalid column id' })

  try {
    await GlobalTableColumnService.remove(columnId)
    setResponseStatus(event, 204)
    return null
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})