import { defineEventHandler, getRouterParam, readBody, createError, setResponseStatus } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { GlobalTableColumnService } from '~~/server/services/global-table-column.service'
import { CreateGlobalTableColumnSchema } from '~~/server/dto/global-table-columns.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const tableId = Number(getRouterParam(event, 'tableId'))
  if (isNaN(tableId)) throw createError({ statusCode: 400, message: 'Invalid table id' })

  const body = await readBody(event)
  const parsed = CreateGlobalTableColumnSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })

  try {
    const created = await GlobalTableColumnService.create(parsed.data, tableId)
    setResponseStatus(event, 201)
    return created
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})