import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { GlobalTableColumnService } from '~~/server/services/global-table-column.service'
import { UpdateGlobalTableColumnSchema } from '~~/server/dto/global-table-columns.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const columnId = Number(getRouterParam(event, 'columnId'))
  if (isNaN(columnId)) throw createError({ statusCode: 400, message: 'Invalid column id' })

  const body = await readBody(event)
  const parsed = UpdateGlobalTableColumnSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })

  try {
    return await GlobalTableColumnService.update(columnId, parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message })
  }
})