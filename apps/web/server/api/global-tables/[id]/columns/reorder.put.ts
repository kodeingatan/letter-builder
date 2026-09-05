import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { GlobalTableColumnService } from '~~/server/services/global-table-column.service'
import { ReorderGlobalTableColumnsSchema } from '~~/server/dto/global-table-columns.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const tableId = Number(getRouterParam(event, 'id'))
  if (isNaN(tableId)) throw createError({ statusCode: 400, message: 'Invalid table id' })

  const body = await readBody(event)
  const parsed = ReorderGlobalTableColumnsSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })

  try {
    await GlobalTableColumnService.reorder(parsed.data)
    return { success: true }
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message })
  }
})